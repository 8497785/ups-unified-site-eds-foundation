// Content List — a category-driven listing.
//
// The author selects a Category page; the block uses the category path as the
// filter prefix against the shared locale query index, so all implementation
// details stay hidden. Entries render as cards (image, date, linked title,
// description) with a "Load More" button.
//
// The query index is a delivery-tier artifact (served on *.aem.page / *.aem.live),
// not on the AEM author host — so in author we render a placeholder instead of
// fetching, and real cards appear on the published/preview site.

import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { getEntries, normalizePath } from '../../scripts/query-index.js';
import { createButton } from '../button/button.js';

// The Load More button reuses the button block's cmp-button styles. EDS only
// auto-loads a block's CSS when that block is on the page, so load button.css
// explicitly here (loadCSS is idempotent — no-op if already present).
loadCSS(`${window.hlx.codeBasePath}/blocks/button/button.css`);

const DEFAULTS = {
  pageSize: 12,
  loadMoreLabel: 'Load More',
  loadMoreStyle: 'primary',
  loadMoreAlignment: 'center',
};

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Read the block's authored cells. Two authoring shapes are supported:
//
// New (category-driven): category, pageSize, loadMoreLabel, showDate,
//   sortBy, maxItems. The selected category (aem-content) is the filter
//   prefix against the shared locale query index.
//
// Legacy (explicit): indexPath, filterPrefix, pageSize, loadMoreLabel,
//   showDate. Detected when the first cell resolves to a query-index.json.
//   The explicit index path is ignored (all lookups use the shared locale
//   index); only the filterPrefix is honored so legacy pages keep working.
function readConfig(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.textContent.trim() || '';
  const firstLink = rows[0]?.querySelector('a');
  const firstRaw = firstLink ? firstLink.getAttribute('href') : cell(0);

  if (/query-index\.json$/.test(firstRaw)) {
    const filterPrefix = normalizePath(cell(1));
    return {
      filterPrefix,
      pageSize: parseInt(cell(2), 10) || DEFAULTS.pageSize,
      loadMoreLabel: cell(3) || DEFAULTS.loadMoreLabel,
      loadMoreStyle: DEFAULTS.loadMoreStyle,
      loadMoreAlignment: DEFAULTS.loadMoreAlignment,
      showDate: /^(true|yes|on)$/i.test(cell(4)),
      sortBy: 'newest',
      maxItems: 0,
    };
  }

  const filterPrefix = normalizePath(firstRaw);
  return {
    filterPrefix,
    pageSize: parseInt(cell(1), 10) || DEFAULTS.pageSize,
    loadMoreLabel: cell(2) || DEFAULTS.loadMoreLabel,
    loadMoreStyle: cell(3) || DEFAULTS.loadMoreStyle,
    loadMoreAlignment: cell(4) || DEFAULTS.loadMoreAlignment,
    showDate: /^(true|yes|on)$/i.test(cell(5)),
    sortBy: cell(6) || 'newest',
    maxItems: parseInt(cell(7), 10) || 0,
  };
}

// Format an ISO date (YYYY-MM-DD) as e.g. "Nov 2, 2021". Returns '' if unparseable.
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  // Category tag from the query index (title + optional link).
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

  // Make the whole card clickable → the article. The title and image keep
  // their own anchors (accessibility/SEO); this handler covers the rest of the
  // card. Clicks on any anchor inside the card (e.g. the eyebrow/category link)
  // are ignored so those links keep their own destination. Modifier/middle
  // clicks fall through to default behavior.
  if (entry.path) {
    li.classList.add('content-list-card-clickable');
    li.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      window.location.assign(entry.path);
    });
  }

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
    filterPrefix, pageSize, loadMoreLabel, loadMoreStyle,
    loadMoreAlignment, showDate, sortBy, maxItems,
  } = readConfig(block);

  // The query index isn't served in the author environment — show a placeholder.
  if (isAuthorEnvironment()) {
    renderPlaceholder(block, pageSize);
    return;
  }

  // Read from the shared locale query index (fetched once per page load) and
  // filter by the category prefix. publishedOnly excludes section landing and
  // category pages (which have no published date).
  const entries = await getEntries({
    pathPrefix: filterPrefix,
    publishedOnly: true,
    sort: sortBy,
    limit: maxItems,
  });

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
    entries.slice(shown, shown + pageSize)
      .forEach((entry) => ul.append(buildCard(entry, showDate)));
    shown += pageSize;
  };

  const moreBtn = createButton({
    label: loadMoreLabel, style: loadMoreStyle, alignment: loadMoreAlignment,
  });
  moreBtn.classList.add('content-list-more');
  moreBtn.addEventListener('click', () => {
    renderNext();
    if (shown >= entries.length) moreBtn.remove();
  });
  wrap.append(moreBtn);

  renderNext();
  if (shown >= entries.length) moreBtn.remove();

  block.replaceChildren(wrap);
}
