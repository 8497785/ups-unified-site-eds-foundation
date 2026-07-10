// Article Header — eyebrow (with optional link), title, description, date, read time.
// Cell order matches the model: eyebrow, eyebrowLink, title, description,
// articleDate, hideReadTime.
//
// Eyebrow Title and Eyebrow Link are optional: when left blank they derive
// automatically from the current page path (the eyebrow points at the parent
// "category" listing page, whose title is read from the site query index). This
// keeps the eyebrow correct on any locale root (/us/en, /language-masters/en)
// without manual authoring.

import { getMetadata } from '../../scripts/aem.js';

const WORDS_PER_MINUTE = 200;

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

function estimateReadTime() {
  const body = document.querySelector('main');
  const words = body ? body.textContent.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// The parent "category" path: current page path minus the article slug, with any
// .html stripped. Root-preserving, so /us/en/... yields a /us/en/... category
// and /language-masters/en/... yields its own root.
function parentCategoryPath() {
  const clean = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const parent = clean.split('/').slice(0, -1).join('/');
  return parent || '/';
}

// Turn a path segment into a readable title (fallback of last resort).
function humanize(path) {
  const seg = path.split('/').filter(Boolean).pop() || '';
  return seg.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Resolve the eyebrow (category) title for a parent path from the site query
// index. Returns '' when the index or a matching row isn't available, so the
// caller can fall back.
async function categoryTitleFromIndex(parentPath) {
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return '';
    const { data = [] } = await resp.json();
    const row = data.find((r) => (r.path || '').replace(/\.html$/, '').replace(/\/$/, '') === parentPath);
    return row ? (row.title || row.category || '') : '';
  } catch (e) {
    return '';
  }
}

export default async function decorate(block) {
  const rows = [...block.children];
  const [eyebrowRow, eyebrowLinkRow, titleRow, descRow, dateRow, hideReadRow] = rows;

  const categoryPath = parentCategoryPath();

  // Eyebrow Link: authored value wins; otherwise the derived parent category path.
  const eyebrowHref = eyebrowLinkRow?.querySelector('a')?.getAttribute('href')
    || cellText(eyebrowLinkRow)
    || categoryPath;

  // Eyebrow Title: authored value wins; otherwise index lookup, then the
  // migration-emitted category metadata, then a humanized path segment.
  let eyebrowText = cellText(eyebrowRow);
  if (!eyebrowText) {
    eyebrowText = await categoryTitleFromIndex(categoryPath)
      || getMetadata('categorytitle')
      || humanize(categoryPath);
  }
  const titleEl = titleRow?.querySelector('h1, h2, h3') || titleRow;
  const descEl = descRow?.querySelector('p') || descRow;
  const dateText = cellText(dateRow);
  const hideReadTime = /^(true|yes|on)$/i.test(cellText(hideReadRow));

  const header = document.createElement('div');
  header.className = 'article-header-content';

  if (eyebrowText) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'article-header-eyebrow';
    if (eyebrowHref) {
      const a = document.createElement('a');
      a.href = eyebrowHref;
      a.textContent = eyebrowText;
      eyebrow.append(a);
    } else {
      eyebrow.textContent = eyebrowText;
    }
    header.append(eyebrow);
  }

  if (titleEl && titleEl.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.className = 'article-header-title';
    h1.textContent = titleEl.textContent.trim();
    header.append(h1);
  }

  const byline = document.createElement('p');
  byline.className = 'article-header-byline';
  if (dateText) {
    const dateSpan = document.createElement('span');
    dateSpan.className = 'article-header-date';
    dateSpan.textContent = dateText;
    byline.append(dateSpan);
  }
  if (!hideReadTime) {
    const readSpan = document.createElement('span');
    readSpan.className = 'article-header-readtime';
    readSpan.textContent = `${estimateReadTime()} MIN READ`;
    byline.append(readSpan);
  }
  if (byline.childElementCount) header.append(byline);

  if (descEl && descEl.textContent.trim()) {
    const desc = document.createElement('p');
    desc.className = 'article-header-description';
    desc.textContent = descEl.textContent.trim();
    header.append(desc);
  }

  block.replaceChildren(header);
}
