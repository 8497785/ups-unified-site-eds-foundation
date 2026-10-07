/* eslint-disable no-underscore-dangle */
/*
 * Awards CF List block — renders award Content Fragments from the AEM GraphQL
 * persisted query `upsstories/award-list`, using the source site's markup
 * (.upspr-awards-recognition__list > .upspr-recognition-list > items).
 *
 * One field: the awards folder, picked by the author (the picker is limited to
 * the awards DAM folder). The awards folder lists every award; a year folder
 * lists that year. The query filters `_path` with STARTS_WITH, so the folder
 * always gets a trailing slash (otherwise ".../2023" would also match a
 * sibling such as ".../2023-archive").
 */
import { getAwardsGraphQLUrl } from '../../scripts/config.js';

const QUERY = 'award-list';
// Site roots an eyebrow PageRef may point into: this site, or the upsstories
// site that the award fragments were authored against.
const SITE_ROOTS = /^\/content\/(about-ups-eds|upsstories)(?=\/)/;
const SKELETON_COUNT = 3;

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Folder path for the query: drop the .html the picker appends, then end with
// exactly one "/". Returns '' when no folder is selected.
export function normalizeFolder(path) {
  const clean = (path || '').trim().replace(/\.html$/, '').replace(/\/+$/, '');
  return clean ? `${clean}/` : '';
}

// 2026-09-29 -> 09-29-2026. Split as text so time zones can't shift the day.
export function formatAwardDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
  return m ? `${m[2]}-${m[3]}-${m[1]}` : (value || '');
}

// Eyebrow link from the PageRef _path. Author keeps the content path (+ .html);
// delivery drops the site prefix and serves the us/en copy of Language Masters
// pages (the only locale published on this site).
export function eyebrowHref(pagePath) {
  if (!pagePath) return '';
  if (isAuthorEnvironment()) return `${pagePath.replace(/\.html$/, '')}.html`;
  return pagePath
    .replace(/\.html$/, '')
    .replace(SITE_ROOTS, '')
    .replace(/^\/language-masters\/en\//, '/us/en/');
}

async function fetchAwards(url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      return json?.data?.awardCfListModelList?.items || [];
    }
  } catch (e) {
    // network/auth/CORS failure — treated as "no awards"
  }
  return [];
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function renderItem(award) {
  const item = el('div', 'upspr-recognition__item');
  const content = el('div', 'content-block');

  if (award.eyebrow) {
    const topic = el('div', 'upspr-content-tile__topic');
    const link = el('a', 'upspr-eyebrow-link upspr-analytics');
    link.title = award.eyebrow;
    link.dataset.linkType = 'story-card-eyebrow';
    const href = eyebrowHref(award.eyebrowLink?._path);
    if (href) link.href = href;
    const head = el('div', 'upspr-eyebrow-head');
    head.append(el('span', 'upspr-eyebrow-text', award.eyebrow));
    link.append(head);
    topic.append(link);
    content.append(topic);
  }

  if (award.title) content.append(el('h3', '', award.title));
  if (award.awardDate) content.append(el('span', 'upspr-story-date', formatAwardDate(award.awardDate)));
  if (award.description) content.append(document.createTextNode(award.description));

  if (award.ctaLink) {
    const wrap = el('div');
    const more = el('a', 'award-read-more', 'Read More');
    more.href = award.ctaLink;
    if (award.linkAction === true) {
      more.target = '_blank';
      more.rel = 'noopener noreferrer';
    } else {
      more.target = '_self';
    }
    more.append(el('i', 'upspr upspr-icon-chevronright'));
    wrap.append(document.createElement('br'), more);
    content.append(wrap);
  }

  item.append(content);
  return item;
}

function renderShell(block) {
  const container = el('div', 'upspr-container upspr-awards-recognition__list');
  const list = el('div', 'upspr-recognition-list');
  container.append(list);
  block.replaceChildren(container);
  return list;
}

function renderSkeleton(list) {
  for (let i = 0; i < SKELETON_COUNT; i += 1) {
    const item = el('div', 'upspr-recognition__item awards-cf-list-skeleton');
    item.innerHTML = '<div class="content-block">'
      + '<div class="skeleton-line skeleton-eyebrow"></div>'
      + '<div class="skeleton-line skeleton-title"></div>'
      + '<div class="skeleton-line skeleton-body"></div>'
      + '<div class="skeleton-line skeleton-body skeleton-body-short"></div></div>';
    list.append(item);
  }
}

export default async function decorate(block) {
  // Single field: the awards folder (aem-content link, or plain text).
  const row = block.children[0];
  const link = row?.querySelector('a');
  const folder = normalizeFolder(link ? link.getAttribute('href') : row?.textContent);

  const list = renderShell(block);
  renderSkeleton(list);

  // No folder selected: authors see the skeleton with a prompt; nothing on delivery.
  if (!folder) {
    if (isAuthorEnvironment()) {
      list.prepend(el('p', 'awards-cf-list-notice', 'Select an awards folder to see the list.'));
    } else {
      block.replaceChildren();
    }
    return;
  }

  const awards = await fetchAwards(getAwardsGraphQLUrl(QUERY, { rootPath: folder }));

  if (!awards.length) {
    if (isAuthorEnvironment()) {
      list.replaceChildren(el('p', 'awards-cf-list-notice', `No awards found in ${folder}`));
    } else {
      block.replaceChildren();
    }
    return;
  }

  list.replaceChildren(...awards.map(renderItem));
}
