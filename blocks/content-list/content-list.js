// Content List — a generic, query-index-driven listing.
//
// The author points the block at a query-index.json (indexPath) and optionally
// scopes it to a path prefix (filterPrefix). Entries are shown newest-first as
// cards (image, date, linked title, description) with a "Load more" button.
//
// The query index is a delivery-tier artifact (served on *.aem.page / *.aem.live),
// not on the AEM author host — so in author we render a placeholder instead of
// fetching, and real cards appear on the published/preview site.

import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULTS = {
  indexPath: '/us/en/newsroom/press-releases/query-index.json',
  filterPrefix: '',
  pageSize: 12,
  loadMoreLabel: 'Load more',
};

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Read the block's authored cells in model order:
// indexPath, filterPrefix, pageSize, loadMoreLabel. Blanks fall back to defaults.
function readConfig(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.textContent.trim() || '';
  const indexPath = cell(0) || DEFAULTS.indexPath;
  const filterPrefix = cell(1) || DEFAULTS.filterPrefix;
  const pageSize = parseInt(cell(2), 10) || DEFAULTS.pageSize;
  const loadMoreLabel = cell(3) || DEFAULTS.loadMoreLabel;
  return {
    indexPath, filterPrefix, pageSize, loadMoreLabel,
  };
}

// Format an ISO date (YYYY-MM-DD) as e.g. "Nov 2, 2021". Returns '' if unparseable.
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Newest first; entries without a valid published date sort last.
function byPublishedDesc(a, b) {
  const ta = Date.parse(a.published || '');
  const tb = Date.parse(b.published || '');
  const va = Number.isNaN(ta) ? -Infinity : ta;
  const vb = Number.isNaN(tb) ? -Infinity : tb;
  return vb - va;
}

function buildCard(entry) {
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

  const date = formatDate(entry.published);
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

// Author placeholder: notice + a few skeleton cards, no data fetch.
function renderPlaceholder(block, pageSize) {
  const wrap = document.createElement('div');
  wrap.className = 'content-list-placeholder';

  const notice = document.createElement('p');
  notice.className = 'content-list-notice';
  notice.textContent = 'Content list — entries appear here on the published site.';
  wrap.append(notice);

  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  for (let i = 0; i < Math.min(pageSize, 6); i += 1) {
    const li = document.createElement('li');
    li.className = 'content-list-card content-list-card-skeleton';
    li.innerHTML = '<div class="content-list-card-image"></div>'
      + '<div class="content-list-card-body">'
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
    indexPath, filterPrefix, pageSize, loadMoreLabel,
  } = readConfig(block);

  // The query index isn't served in the author environment — show a placeholder.
  if (isAuthorEnvironment()) {
    renderPlaceholder(block, pageSize);
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

  if (filterPrefix) {
    entries = entries.filter((e) => (e.path || '').startsWith(filterPrefix));
  }
  // Only list article/story entries: section landing and category pages appear
  // in the index without a published date — exclude them from the listing.
  entries = entries.filter((e) => e.published);
  entries.sort(byPublishedDesc);

  const wrap = document.createElement('div');
  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  wrap.append(ul);

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'content-list-empty';
    empty.textContent = 'No entries found.';
    wrap.append(empty);
    block.replaceChildren(wrap);
    return;
  }

  let shown = 0;
  const renderNext = () => {
    entries.slice(shown, shown + pageSize).forEach((entry) => ul.append(buildCard(entry)));
    shown += pageSize;
  };

  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'content-list-more';
  moreBtn.textContent = loadMoreLabel;
  moreBtn.addEventListener('click', () => {
    renderNext();
    if (shown >= entries.length) moreBtn.remove();
  });
  wrap.append(moreBtn);

  renderNext();
  if (shown >= entries.length) moreBtn.remove();

  block.replaceChildren(wrap);
}
