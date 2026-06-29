/* eslint-disable no-underscore-dangle */
/* Leadership Listing block — renders leadership profiles from AEM GraphQL. */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_PROJECT = 'ups-global';
const DEFAULT_QUERY = 'leadership-list';

/**
 * Derive the EDS bio page path from a CF _path. The bio pages are children
 * of the current leadership page, so the link base is derived from the
 * current page path — keeping it locale-aware (works under any /<region>/<lang>/
 * or clean-URL mapping) instead of a hardcoded prefix. The ordering prefix
 * (e.g. "01-a-") is stripped from the slug.
 */
function deriveBioLink(cfPath) {
  const slug = cfPath.replace(/\/$/, '').split('/').pop();
  const name = slug.replace(/^\d+-[a-z]-/, '').replace(/^\d+-/, '');
  const base = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return `${base}/${name}.html`;
}

/**
 * Normalize a Content Fragment root path: drop the .html suffix the
 * aem-content picker appends and any trailing slash.
 */
function normalizeRootPath(path) {
  return (path || '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Build the AEM GraphQL persisted-query URL with raw (unencoded) semicolon
 * params — the persisted query parses the literal path/tag values, so
 * encoding the slashes/colons would break the `tag` variable.
 * Same-origin (author tier): /graphql/execute.json/{project}/{query};rootPath=..;tag=..
 */
function buildQueryUrl(project, queryName, rootPath, tags) {
  let url = `/graphql/execute.json/${project}/${queryName}`;
  const cleanRoot = normalizeRootPath(rootPath);
  if (cleanRoot) url += `;rootPath=${cleanRoot}`;
  if (tags && tags.length) url += `;tag=${tags.join('/')}`;
  return url;
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

function renderCard(item) {
  const li = document.createElement('li');

  const anchor = document.createElement('a');
  anchor.className = 'leadership-card-link';
  anchor.href = item._path ? deriveBioLink(item._path) : '#';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'leadership-card-image';
  const headshot = item.headshot && item.headshot._path;
  const altName = [item.firstName, item.lastName].filter(Boolean).join(' ');
  if (headshot) {
    const pic = createOptimizedPicture(headshot, altName, false, [{ width: '400' }]);
    imageWrap.append(pic);
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
  const project = DEFAULT_PROJECT;
  const queryName = DEFAULT_QUERY;

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

  const url = buildQueryUrl(project, queryName, rootPath, tags);
  const leaders = await fetchLeaders(url);
  leaders.forEach((item) => ul.append(renderCard(item)));
}
