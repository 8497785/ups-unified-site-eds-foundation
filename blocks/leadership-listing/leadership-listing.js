/* eslint-disable no-underscore-dangle */
/* Leadership Listing block — renders leadership profiles from AEM GraphQL. */
import { moveInstrumentation } from '../../scripts/scripts.js';
import { getGraphQLUrl, getDynamicMediaUrl } from '../../scripts/config.js';

const DEFAULT_QUERY = 'leadership-list';

/**
 * Derive the EDS bio page path from a CF _path. The bio pages are children of
 * the current leadership page, so the link is the current page path plus the
 * last segment of the CF _path (e.g. ".../our-leadership/carol-tome" →
 * "<current-path>/carol-tome").
 */
function deriveBioLink(cfPath) {
  const slug = cfPath.replace(/\/$/, '').split('/').pop();
  const base = window.location.pathname.replace(/\/$/, '');
  return `${base}/${slug}`;
}

/**
 * Normalize a Content Fragment root path: drop the .html suffix the
 * aem-content picker appends and any trailing slash.
 */
function normalizeRootPath(path) {
  return (path || '').replace(/\.html$/, '').replace(/\/$/, '');
}

async function fetchLeaders(url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      return json?.data?.leaderships?.list || [];
    }
  } catch (e) {
    // network/auth/CORS failure — fall through to empty
  }
  return [];
}

// Placeholder skeleton shown when no root Content Fragment is selected, so
// authors see the block's card layout instead of an empty region.
function renderSkeleton(block, count = 4) {
  const notice = document.createElement('p');
  notice.className = 'leadership-placeholder-notice';
  notice.textContent = 'Select a leadership root Content Fragment to see the listing.';

  const ul = document.createElement('ul');
  ul.className = 'leadership-listing-skeleton';
  for (let i = 0; i < count; i += 1) {
    const li = document.createElement('li');
    li.innerHTML = '<div class="leadership-card-link">'
      + '<div class="leadership-card-image skeleton-box"></div>'
      + '<div class="leadership-card-body">'
      + '<div class="skeleton-line skeleton-name"></div>'
      + '<div class="skeleton-line skeleton-role"></div></div></div>';
    ul.append(li);
  }
  block.replaceChildren(notice, ul);
}

function renderCard(item) {
  const li = document.createElement('li');

  const anchor = document.createElement('a');
  anchor.className = 'leadership-card-link';
  anchor.href = item._path ? deriveBioLink(item._path) : '#';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'leadership-card-image';
  const headshot = item.headshot && (item.headshot._dynamicUrl || item.headshot._path);
  const altName = [item.firstName, item.lastName].filter(Boolean).join(' ');
  if (headshot) {
    // _dynamicUrl is the Dynamic Media delivery path; add render params for cards.
    const img = document.createElement('img');
    img.src = getDynamicMediaUrl(headshot, { width: 400 });
    img.alt = altName;
    img.loading = 'lazy';
    imageWrap.append(img);
  }

  const body = document.createElement('div');
  body.className = 'leadership-card-body';

  const name = [item.firstName, item.lastName].filter(Boolean).join(' ');
  if (name) {
    const h3 = document.createElement('h3');
    h3.textContent = name;
    body.append(h3);
  }

  if (item.subtitle) {
    const role = document.createElement('p');
    role.textContent = item.subtitle;
    body.append(role);
  }

  anchor.append(imageWrap, body);
  li.append(anchor);
  return li;
}

export default async function decorate(block) {
  // Container model fields, in order: title, rootPath, tags, cta(anchor).
  const rows = [...block.children];
  const titleRow = rows[0];
  const rootPathRow = rows[1];
  const tagsRow = rows[2];
  const ctaRow = rows[3];

  const titleText = titleRow ? titleRow.textContent.trim() : '';
  const rootPathLink = rootPathRow ? rootPathRow.querySelector('a') : null;
  let rootPath = '';
  if (rootPathLink) rootPath = rootPathLink.getAttribute('href');
  else if (rootPathRow) rootPath = rootPathRow.textContent.trim();
  // Tags may render as multiple child elements (string[]) or as a single
  // comma/whitespace-separated text value — handle both.
  let tags = [];
  if (tagsRow) {
    const tagEls = [...tagsRow.querySelectorAll('li, p, span, a')];
    if (tagEls.length) {
      tags = tagEls.map((el) => el.textContent.trim()).filter(Boolean);
    } else {
      tags = tagsRow.textContent.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    }
  }
  const ctaLinkEl = ctaRow ? ctaRow.querySelector('a') : null;
  const ctaHref = ctaLinkEl ? ctaLinkEl.getAttribute('href') : '';
  const ctaText = ctaLinkEl ? ctaLinkEl.textContent.trim() : '';

  // No root Content Fragment selected — show a placeholder skeleton.
  if (!normalizeRootPath(rootPath)) {
    renderSkeleton(block);
    return;
  }

  // Header (title + optional CTA) — mirrors leadership-list-cf structure.
  const headerRow = document.createElement('div');
  headerRow.className = 'leadership-list-header';

  const heading = document.createElement('h2');
  heading.className = 'leadership-list-title';
  if (titleRow) moveInstrumentation(titleRow, heading);
  heading.textContent = titleText;
  headerRow.append(heading);

  if (ctaText && ctaHref) {
    const cta = document.createElement('a');
    cta.className = 'leadership-list-cta';
    cta.href = ctaHref;
    cta.textContent = ctaText;
    headerRow.append(cta);
  }

  const hasHeader = titleText || (ctaText && ctaHref);

  const ul = document.createElement('ul');

  if (hasHeader) block.replaceChildren(headerRow, ul);
  else block.replaceChildren(ul);

  const url = getGraphQLUrl(DEFAULT_QUERY, {
    rootPath: normalizeRootPath(rootPath),
    tag: tags.join('/'),
  });
  const leaders = await fetchLeaders(url);
  leaders.forEach((item) => ul.append(renderCard(item)));
}
