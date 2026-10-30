// Related Articles — three modes:
//
// Dynamic: list articles automatically. If a Category is selected, list
//   articles under that category (newest first); otherwise fall back to
//   siblings under the CURRENT page's parent. Limited by "Number of Articles".
// Static: the author picks up to 3 specific article paths; each card's
//   content is read from the shared query index (title, image, category,
//   categoryUrl, published) — a picked path not in the index is skipped.
// In the News: one card per authored News Story item (external news, press
//   coverage), as on the source site's three-column teaser "newsFeed" view.
//   Desktop/mobile show the first "Desktop initial load view count" cards,
//   tablet (768–1023px) the first "Tablet initial load view count"; Load More
//   reveals the next batch of the same size, then hides.
//
// The query index is a delivery-tier artifact (served on *.aem.page/.aem.live),
// not on the AEM author host — so in author Dynamic/Static render a
// placeholder. In the News needs no index, so its cards render everywhere.
//
// Authoring model (see _related-articles.json):
//   Block rows (one cell each): mode, category, articleCount, path1, path2,
//     path3, showDate, loadMoreLabel, desktopCount, tabletCount
//   Item rows (News Story, several cells): image (with alt) | source | title |
//     date | description | link | newTab

import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { getEntries } from '../../scripts/query-index.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { createButton } from '../button/button.js';

// Reuse the content-list card styles (grid, card, skeleton) rather than
// duplicating them. EDS only auto-loads a block's own CSS, so load the shared
// content-list stylesheet here (loadCSS is idempotent — no-op if present).
// Load More reuses the button block's cmp-button styles the same way.
loadCSS(`${window.hlx.codeBasePath}/blocks/content-list/content-list.css`);
loadCSS(`${window.hlx.codeBasePath}/blocks/button/button.css`);

const DEFAULTS = {
  mode: 'dynamic',
  articleCount: 3,
  showDate: false,
  loadMoreLabel: 'Load more',
  desktopCount: 3,
  tabletCount: 2,
};

// Tablet viewport for the In the News initial / Load More batch size.
const TABLET = '(768px <= width < 1024px)';

const MAX_STATIC = 3;

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Normalize a path for comparison/fetch: strip content-source prefix,
// .html suffix, and trailing slash. Delivery paths are public (/us/en/...).
// Language Masters paths map to their us/en copy: a picked page that didn't
// exist in us/en at rollout keeps its language-masters reference, and must
// still match the us/en index once that page is migrated.
export function normalizePath(p) {
  return (p || '')
    .replace(/^\/content\/about-ups-eds/, '')
    .replace(/^\/language-masters\/en\//, '/us/en/')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
}

// With no articles to show, hide the whole section when it holds only this
// block and Title blocks, so a "Related Stories" heading isn't left on its own.
// A class (not an inline style): the section loader clears inline display
// after the blocks decorate.
function hideEmptySection(block) {
  const section = block.closest('.section');
  const wrapper = block.parentElement;
  if (!section || !wrapper) return;
  const others = [...section.children].filter((child) => child !== wrapper);
  if (others.every((child) => child.classList.contains('title-wrapper'))) {
    section.classList.add('related-articles-empty');
  }
}

// Read an authored aem-content cell: prefer the anchor href, else text.
function cellPath(row) {
  if (!row) return '';
  const a = row.querySelector('a');
  return normalizePath(a ? a.getAttribute('href') : row.textContent.trim());
}

// News Story items have several cells; in the Universal Editor they are also
// marked with their model, which catches a new item whose empty cells are left
// out.
const isNewsItem = (row) => row.children.length > 1 || row.dataset.aueModel === 'related-news-item';

// A whole number within [min, max]; the default when blank or not a number.
function clampCount(value, min, max, fallback) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n));
}

// Read the block's authored cells (item rows excluded), in model order from
// the Mode cell onward: mode, category, articleCount, path1, path2, path3,
// showDate, loadMoreLabel, desktopCount, tabletCount.
//
// The Mode cell is located by value (dynamic|static|news) rather than by a
// fixed index, so pages authored before the Heading field was removed — which
// still deliver a leading heading cell — keep working without re-authoring.
function readConfig(rows) {
  const cell = (r) => (r?.textContent || '').trim();
  const start = rows.findIndex((r) => /^(dynamic|static|news)$/i.test(cell(r)));
  const base = start === -1 ? 0 : start;
  const at = (offset) => rows[base + offset];

  const mode = (cell(at(0)) || DEFAULTS.mode).toLowerCase();
  const category = cellPath(at(1));
  const articleCount = parseInt(cell(at(2)), 10) || DEFAULTS.articleCount;
  const paths = [cellPath(at(3)), cellPath(at(4)), cellPath(at(5))]
    .filter(Boolean)
    .slice(0, MAX_STATIC);
  const showDate = /^(true|yes|on)$/i.test(cell(at(6)));
  const loadMoreLabel = cell(at(7)) || DEFAULTS.loadMoreLabel;
  const desktopCount = clampCount(cell(at(8)), 3, 9, DEFAULTS.desktopCount);
  const tabletCount = clampCount(cell(at(9)), 2, 8, DEFAULTS.tabletCount);
  return {
    mode, category, articleCount, paths, showDate, loadMoreLabel, desktopCount, tabletCount,
  };
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// An authored News Date (YYYY-MM-DD) is a calendar day, not an instant: format
// it in UTC so it doesn't show as the previous day in US time zones.
function formatNewsDate(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// Card from a query-index entry, or from a News Story (entry.picture is its
// authored <picture>, entry.dateLabel its formatted date, entry.newTab opens
// its links in a new tab).
function buildCard(entry, showDate) {
  const li = document.createElement('li');
  li.className = 'content-list-card';

  if (entry.image || entry.picture) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'content-list-card-image';
    const pic = entry.picture
      || createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]);
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

  const date = showDate ? (entry.dateLabel || formatDate(entry.published)) : '';
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'content-list-card-date';
    dateEl.textContent = date;
    body.append(dateEl);
  }

  // Title + description share a single anchor to the article (matching the
  // content-list card). The image keeps its own anchor; the eyebrow/category
  // keeps its separate link.
  if (entry.title || entry.description) {
    const a = document.createElement('a');
    a.href = entry.path;

    if (entry.title) {
      const h = document.createElement('h3');
      h.className = 'content-list-card-title';
      h.textContent = entry.title;
      a.append(h);
    }

    if (entry.description) {
      const desc = document.createElement('p');
      desc.className = 'content-list-card-description';
      desc.textContent = entry.description;
      a.append(desc);
    }

    body.append(a);
  }

  li.append(body);

  if (entry.newTab) {
    li.querySelectorAll('a[href]').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }
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

// Entrance animation, as on the source site (.upspr-animation): the cards
// animate once, the first time the block scrolls into view. Until then they
// are held hidden (related-articles-pending), so they don't show and then jump
// back to the animation's start. Without IntersectionObserver, or with reduced
// motion requested, the cards simply show.
function animateOnView(block) {
  if (!('IntersectionObserver' in window)
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  block.classList.add('related-articles-pending');
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    block.classList.replace('related-articles-pending', 'related-articles-animate');
  });
  observer.observe(block);
}

// Static: resolve each authored path from the shared query index, preserving
// author order. The index is the single source (title, image, category,
// categoryUrl, published) — no per-page fetch. A picked path that isn't in the
// index is skipped.
async function selectStatic(paths) {
  return getEntries({ paths });
}

// In the News: one card per News Story item. Title and link are required:
// incomplete items are skipped on the site, but shown as a placeholder in the
// Universal Editor (instrumented rows) so a story just added with + is visible
// and selectable. While editing, every story shows and there is no Load More.
function renderNews(block, itemRows, config) {
  const {
    showDate, loadMoreLabel, desktopCount, tabletCount,
  } = config;
  const editing = isAuthorEnvironment() || itemRows.some((row) => row.hasAttribute('data-aue-resource'));
  const text = (cell) => (cell?.textContent || '').trim();

  const cards = itemRows.map((row) => {
    const [
      imageCell, sourceCell, titleCell, dateCell, descCell, linkCell, newTabCell,
    ] = row.children;
    const title = text(titleCell);
    const href = linkCell?.querySelector('a[href]')?.getAttribute('href') || text(linkCell);
    const complete = title && href;
    if (!complete && !editing) return null;
    const picture = imageCell?.querySelector('picture');
    const img = picture?.querySelector('img');
    if (img && !img.alt) img.alt = title;
    const li = buildCard({
      path: href || '#',
      picture,
      title: title || 'New news story: add a title and link',
      description: text(descCell),
      category: text(sourceCell),
      dateLabel: formatNewsDate(text(dateCell)),
      newTab: /^(true|yes|on)$/i.test(text(newTabCell)),
    }, showDate);
    if (!complete) li.classList.add('related-articles-item-incomplete');
    moveInstrumentation(row, li);
    return li;
  }).filter(Boolean);

  block.classList.add('related-articles-news');
  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  ul.append(...cards);
  block.replaceChildren(ul);

  if (!cards.length) {
    hideEmptySection(block);
    return;
  }
  if (editing) return;

  // Initial count and Load More batch follow the viewport: tablet count on
  // tablet, desktop count on desktop and mobile. A breakpoint change before
  // Load More is used re-applies the initial count.
  const tablet = window.matchMedia(TABLET);
  const batch = () => (tablet.matches ? tabletCount : desktopCount);
  let shown = batch();
  let expanded = false;

  const moreBtn = createButton({ label: loadMoreLabel, style: 'secondary', alignment: 'center' });
  moreBtn.classList.add('related-articles-more');
  const update = () => {
    cards.forEach((li, i) => { li.hidden = i >= shown; });
    moreBtn.hidden = shown >= cards.length;
  };
  moreBtn.addEventListener('click', () => {
    expanded = true;
    shown += batch();
    update();
  });
  tablet.addEventListener('change', () => {
    if (expanded) return;
    shown = batch();
    update();
  });

  block.append(moreBtn);
  update();
  animateOnView(block);
}

export default async function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter(isNewsItem);
  const config = readConfig(rows.filter((row) => !isNewsItem(row)));
  const {
    mode, category, articleCount, paths, showDate,
  } = config;

  if (mode === 'news') {
    renderNews(block, itemRows, config);
    return;
  }

  if (isAuthorEnvironment()) {
    renderPlaceholder(block, mode === 'static' ? Math.max(paths.length, 1) : articleCount);
    return;
  }

  const selected = mode === 'static'
    ? await selectStatic(paths)
    : await selectDynamic(category, articleCount);

  if (selected.length === 0) {
    block.replaceChildren();
    hideEmptySection(block);
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'content-list-grid';
  selected.forEach((entry) => ul.append(buildCard(entry, showDate)));

  block.replaceChildren(ul);
  animateOnView(block);
}
