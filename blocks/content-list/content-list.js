// Content List — a category-driven listing.
//
// The author selects a Category page; the block derives the section's
// query-index.json and uses the category path as the filter prefix, so all
// implementation details (index path, prefix) stay hidden. Entries render as
// cards (image, date, linked title, description) with a "Load More" button.
//
// The query index is a delivery-tier artifact (served on *.aem.page / *.aem.live),
// not on the AEM author host — so in author we render a placeholder instead of
// fetching, and real cards appear on the published/preview site.

import { createOptimizedPicture } from '../../scripts/aem.js';
import { createButton } from '../button/button.js';

const DEFAULTS = {
  pageSize: 12,
  loadMoreLabel: 'Load More',
  loadMoreStyle: 'primary',
};

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Normalize an authored category reference to a delivery path:
// drop the .html suffix, any trailing slash, and a leading /content/<site>
// segment pair (present on author-env aem-content refs). Delivery hrefs are
// already public (e.g. /us/en/newsroom/press-releases/customer-first).
function normalizeCategoryPath(raw) {
  let p = (raw || '').trim().replace(/\.html$/, '').replace(/\/$/, '');
  if (p.startsWith('/content/')) p = `/${p.split('/').slice(3).join('/')}`;
  return p;
}

// Candidate query-index.json locations at or above a path, nearest first, e.g.
// /a/b/c -> [/a/b/c/query-index.json, /a/b/query-index.json, /a/query-index.json].
// The block probes these in order and uses the first that resolves, so a single
// query-index.json per major section is found automatically for any category
// beneath it (and for the section landing page itself).
function candidateIndexPaths(prefix) {
  const segments = prefix.split('/').filter(Boolean);
  const paths = [];
  for (let i = segments.length; i >= 1; i -= 1) {
    paths.push(`/${segments.slice(0, i).join('/')}/query-index.json`);
  }
  return paths;
}

// Read the block's authored cells. Two authoring shapes are supported:
//
// New (category-driven): category, pageSize, loadMoreLabel, showDate,
//   sortBy, maxItems. The selected category (aem-content) is the filter
//   prefix; the query index is derived automatically (candidateIndexPaths),
//   hiding those details from authors.
//
// Legacy (explicit): indexPath, filterPrefix, pageSize, loadMoreLabel,
//   showDate. Detected when the first cell resolves to a query-index.json.
//   Kept so pages authored before the simplification keep working.
function readConfig(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.textContent.trim() || '';
  const firstLink = rows[0]?.querySelector('a');
  const firstRaw = firstLink ? firstLink.getAttribute('href') : cell(0);

  if (/query-index\.json$/.test(firstRaw)) {
    const indexPath = firstRaw.trim();
    const filterPrefix = cell(1);
    return {
      indexPath,
      filterPrefix,
      pageSize: parseInt(cell(2), 10) || DEFAULTS.pageSize,
      loadMoreLabel: cell(3) || DEFAULTS.loadMoreLabel,
      loadMoreStyle: DEFAULTS.loadMoreStyle,
      showDate: /^(true|yes|on)$/i.test(cell(4)),
      sortBy: 'newest',
      maxItems: 0,
    };
  }

  const filterPrefix = normalizeCategoryPath(firstRaw);
  return {
    filterPrefix,
    pageSize: parseInt(cell(1), 10) || DEFAULTS.pageSize,
    loadMoreLabel: cell(2) || DEFAULTS.loadMoreLabel,
    loadMoreStyle: cell(3) || DEFAULTS.loadMoreStyle,
    showDate: /^(true|yes|on)$/i.test(cell(4)),
    sortBy: cell(5) || 'newest',
    maxItems: parseInt(cell(6), 10) || 0,
  };
}

// Format an ISO date (YYYY-MM-DD) as e.g. "Nov 2, 2021". Returns '' if unparseable.
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Return a comparator for the selected sort. Entries without a valid published
// date sort last for date-based orders.
function comparatorFor(sortBy) {
  if (sortBy === 'title') {
    return (a, b) => (a.title || '').localeCompare(b.title || '');
  }
  const dir = sortBy === 'oldest' ? -1 : 1;
  return (a, b) => {
    const ta = Date.parse(a.published || '');
    const tb = Date.parse(b.published || '');
    const va = Number.isNaN(ta) ? -Infinity : ta;
    const vb = Number.isNaN(tb) ? -Infinity : tb;
    return (vb - va) * dir;
  };
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
    indexPath, filterPrefix, pageSize, loadMoreLabel, loadMoreStyle,
    showDate, sortBy, maxItems,
  } = readConfig(block);

  // The query index isn't served in the author environment — show a placeholder.
  if (isAuthorEnvironment()) {
    renderPlaceholder(block, pageSize);
    return;
  }

  // Resolve the index: explicit (legacy) path, else probe the derived
  // candidates at/above the category and use the first that resolves.
  const candidates = indexPath ? [indexPath] : candidateIndexPaths(filterPrefix);
  let entries = [];
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(candidates[i]);
      if (resp.ok) {
        // eslint-disable-next-line no-await-in-loop
        const json = await resp.json();
        entries = json.data || [];
        break;
      }
    } catch (e) {
      // try the next candidate
    }
  }

  if (filterPrefix) {
    entries = entries.filter((e) => (e.path || '').startsWith(filterPrefix));
  }
  // Only list article/story entries: section landing and category pages appear
  // in the index without a published date — exclude them from the listing.
  entries = entries.filter((e) => e.published);
  entries.sort(comparatorFor(sortBy));
  if (maxItems > 0) entries = entries.slice(0, maxItems);

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

  const moreBtn = createButton({ label: loadMoreLabel, style: loadMoreStyle });
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
