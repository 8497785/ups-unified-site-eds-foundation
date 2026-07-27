// Related Articles — two modes:
//
// Dynamic: list articles automatically. If a Category is selected, list
//   articles under that category (newest first); otherwise fall back to
//   siblings under the CURRENT page's parent. Limited by "Number of Articles".
// Static: the author picks up to 3 specific article paths; each card's
//   content is pulled from that page's <head> meta (title, image, description).
//
// The query index is a delivery-tier artifact (served on *.aem.page/.aem.live),
// not on the AEM author host — so in author we render a placeholder.

import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { getEntries } from '../../scripts/query-index.js';

// Reuse the content-list card styles (grid, card, skeleton) rather than
// duplicating them. EDS only auto-loads a block's own CSS, so load the shared
// content-list stylesheet here (loadCSS is idempotent — no-op if present).
loadCSS(`${window.hlx.codeBasePath}/blocks/content-list/content-list.css`);

const DEFAULTS = {
  mode: 'dynamic',
  articleCount: 3,
  showDate: false,
};

const MAX_STATIC = 3;

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Normalize a path for comparison/fetch: strip content-source prefix,
// .html suffix, and trailing slash. Delivery paths are public (/us/en/...).
function normalizePath(p) {
  return (p || '')
    .replace(/^\/content\/about-ups-eds/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

// Read an authored aem-content cell: prefer the anchor href, else text.
function cellPath(row) {
  if (!row) return '';
  const a = row.querySelector('a');
  return normalizePath(a ? a.getAttribute('href') : row.textContent.trim());
}

// Read the block's authored cells, in model order from the Mode cell onward:
// mode, category, articleCount, path1, path2, path3, showDate.
//
// The Mode cell is located by value (dynamic|static) rather than by a fixed
// index, so pages authored before the Heading field was removed — which still
// deliver a leading heading cell — keep working without re-authoring.
function readConfig(block) {
  const rows = [...block.children];
  const cell = (r) => (r?.textContent || '').trim();
  const start = rows.findIndex((r) => /^(dynamic|static)$/i.test(cell(r)));
  const base = start === -1 ? 0 : start;
  const at = (offset) => rows[base + offset];

  const mode = (cell(at(0)) || DEFAULTS.mode).toLowerCase();
  const category = cellPath(at(1));
  const articleCount = parseInt(cell(at(2)), 10) || DEFAULTS.articleCount;
  const paths = [cellPath(at(3)), cellPath(at(4)), cellPath(at(5))]
    .filter(Boolean)
    .slice(0, MAX_STATIC);
  const showDate = /^(true|yes|on)$/i.test(cell(at(6)));
  return {
    mode, category, articleCount, paths, showDate,
  };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Fetch a page and read its <head> meta into a card entry. Used by static mode
// so any page can be featured, not just indexed articles.
async function fetchPageEntry(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return null;
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const meta = (sel) => doc.querySelector(sel)?.getAttribute('content') || '';
    const title = meta('meta[property="og:title"]') || doc.querySelector('title')?.textContent || '';
    return {
      path,
      title: title.trim(),
      description: meta('meta[name="description"]'),
      image: meta('meta[property="og:image"]'),
      category: meta('meta[name="categorytitle"]'),
      categoryUrl: meta('meta[name="categoryurl"]'),
      published: meta('meta[name="publishdate"]'),
    };
  } catch (e) {
    return null;
  }
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

  if (entry.category) {
    const category = document.createElement('p');
    category.className = 'content-list-card-category';
    if (entry.categoryUrl) {
      const a = document.createElement('a');
      a.href = entry.categoryUrl;
      a.textContent = entry.category;
      category.append(a);
    } else {
      category.textContent = entry.category;
    }
    body.append(category);
  }

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

function renderPlaceholder(block, count) {
  const wrap = document.createElement('div');
  wrap.className = 'related-articles-placeholder';

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

// Dynamic: category articles if a category is set, else siblings of the
// current page. Reads the shared locale query index (fetched once per page
// load), keeps direct children of the scope, excludes the current page, newest
// first, limited by count.
async function selectDynamic(category, articleCount) {
  const currentPath = normalizePath(window.location.pathname);
  // Listing scope: the selected category, or the current page's parent
  // (siblings) when no category is set.
  const scope = category || currentPath.split('/').slice(0, -1).join('/');

  return getEntries({
    pathPrefix: scope,
    directChildren: true,
    publishedOnly: true,
    excludePath: currentPath,
    sort: 'newest',
    limit: articleCount,
  });
}

// Static: fetch each authored path's page meta, preserving author order.
async function selectStatic(paths) {
  const entries = await Promise.all(paths.map((p) => fetchPageEntry(p)));
  return entries.filter(Boolean);
}

export default async function decorate(block) {
  const {
    mode, category, articleCount, paths, showDate,
  } = readConfig(block);

  if (isAuthorEnvironment()) {
    renderPlaceholder(block, mode === 'static' ? Math.max(paths.length, 1) : articleCount);
    return;
  }

  const selected = mode === 'static'
    ? await selectStatic(paths)
    : await selectDynamic(category, articleCount);

  if (selected.length === 0) {
    block.replaceChildren();
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  selected.forEach((entry) => ul.append(buildCard(entry, showDate)));

  block.replaceChildren(ul);
}
