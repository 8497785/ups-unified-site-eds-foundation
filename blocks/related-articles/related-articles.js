// Related Articles — sibling articles under the same parent, newest first.
//
// Reads the section query index, keeps entries that are direct children of the
// CURRENT page's parent (i.e. its siblings), excludes the current page itself,
// sorts by published date descending, and shows the first N (author-set).
// Example: on page2, the related list is page1, page3, page4 (page2 skipped).
//
// The query index is a delivery-tier artifact (served on *.aem.page/.aem.live),
// not on the AEM author host — so in author we render a placeholder.

import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULTS = {
  heading: 'Related Articles',
  articleCount: 3,
  indexPath: '/us/en/newsroom/press-releases/query-index.json',
  showDate: false,
};

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Read the block's authored cells in model order:
// heading, articleCount, indexPath, showDate. Blanks fall back to defaults.
function readConfig(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.textContent.trim() || '';
  const heading = cell(0) || DEFAULTS.heading;
  const articleCount = parseInt(cell(1), 10) || DEFAULTS.articleCount;
  const indexPath = cell(2) || DEFAULTS.indexPath;
  const showDate = /^(true|yes|on)$/i.test(cell(3));
  return {
    heading, articleCount, indexPath, showDate,
  };
}

// Normalize a path for comparison: strip content-source prefix + .html + trailing slash.
function normalizePath(p) {
  return (p || '')
    .replace(/^\/content\/about-ups-eds/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

// The parent path of the current page (drop the last/leaf segment).
function currentParentPath() {
  const path = normalizePath(window.location.pathname);
  return path.split('/').slice(0, -1).join('/');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function byPublishedDesc(a, b) {
  const ta = Date.parse(a.published || '');
  const tb = Date.parse(b.published || '');
  const va = Number.isNaN(ta) ? -Infinity : ta;
  const vb = Number.isNaN(tb) ? -Infinity : tb;
  return vb - va;
}

function buildCard(entry, showDate) {
  const li = document.createElement('li');
  li.className = 'content-list-card';

  if (entry.image) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'content-list-card-image';
    const pic = createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]);
    const a = document.createElement('a');
    a.href = entry.path;
    a.append(pic);
    imgWrap.append(a);
    li.append(imgWrap);
  }

  const body = document.createElement('div');
  body.className = 'content-list-card-body';

  const category = document.createElement('p');
  category.className = 'content-list-card-category';
  category.textContent = 'Category';
  body.append(category);

  const date = showDate ? formatDate(entry.published) : '';
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'content-list-card-date';
    dateEl.textContent = date;
    body.append(dateEl);
  }

  if (entry.title) {
    const h = document.createElement('h3');
    h.className = 'content-list-card-title';
    const a = document.createElement('a');
    a.href = entry.path;
    a.textContent = entry.title;
    h.append(a);
    body.append(h);
  }

  if (entry.description) {
    const desc = document.createElement('p');
    desc.className = 'content-list-card-description';
    desc.textContent = entry.description;
    body.append(desc);
  }

  li.append(body);
  return li;
}

function renderPlaceholder(block, heading, count) {
  const wrap = document.createElement('div');
  wrap.className = 'related-articles-placeholder';

  const h = document.createElement('h2');
  h.className = 'related-articles-heading';
  h.textContent = heading;
  wrap.append(h);

  const notice = document.createElement('p');
  notice.className = 'content-list-notice';
  notice.textContent = 'Related articles appear here on the published site.';
  wrap.append(notice);

  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  for (let i = 0; i < count; i += 1) {
    const li = document.createElement('li');
    li.className = 'content-list-card content-list-card-skeleton';
    li.innerHTML = '<div class="content-list-card-image"></div>'
      + '<div class="content-list-card-body">'
      + '<p class="content-list-card-category"></p>'
      + '<p class="content-list-card-date"></p>'
      + '<h3 class="content-list-card-title"></h3>'
      + '<p class="content-list-card-description"></p></div>';
    ul.append(li);
  }
  wrap.append(ul);
  block.replaceChildren(wrap);
}

export default async function decorate(block) {
  const {
    heading, articleCount, indexPath, showDate,
  } = readConfig(block);

  if (isAuthorEnvironment()) {
    renderPlaceholder(block, heading, articleCount);
    return;
  }

  let entries = [];
  try {
    const resp = await fetch(indexPath);
    if (resp.ok) {
      const json = await resp.json();
      entries = json.data || [];
    }
  } catch (e) {
    entries = [];
  }

  const parentPath = currentParentPath();
  const currentPath = normalizePath(window.location.pathname);

  entries = entries
    // Siblings: direct children of the current page's parent.
    .filter((e) => {
      const p = normalizePath(e.path);
      return p.startsWith(`${parentPath}/`)
        && p.slice(parentPath.length + 1).indexOf('/') === -1;
    })
    // Real articles only (listing/category pages have no published date).
    .filter((e) => e.published)
    // Exclude the current page.
    .filter((e) => normalizePath(e.path) !== currentPath);

  entries.sort(byPublishedDesc);
  const selected = entries.slice(0, articleCount);

  const wrap = document.createElement('div');

  const h = document.createElement('h2');
  h.className = 'related-articles-heading';
  h.textContent = heading;
  wrap.append(h);

  if (selected.length === 0) {
    block.replaceChildren(wrap);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  selected.forEach((entry) => ul.append(buildCard(entry, showDate)));
  wrap.append(ul);

  block.replaceChildren(wrap);
}
