// Breadcrumb — builds the trail from the current page path, labeling each crumb
// from the shared locale query index with a title-cased slug fallback for any
// ancestor not present in the index. The index is loaded via the shared
// query-index service, so it is fetched once per page load and reused by every
// block on the page.

import { loadQueryIndex } from '../../scripts/query-index.js';

// Content-source prefixes that appear in author/preview URLs but not on the
// clean delivery path. Stripping them turns
// /content/about-ups-eds/us/en/newsroom/... into /us/en/newsroom/... so the
// locale root (/us/en) is detected correctly and the crumbs don't include the
// content/site segments.
const PATH_PREFIXES = [
  '/content/about-ups-eds',
];

// Normalize a raw pathname: strip a known content-source prefix and .html so
// crumb logic always works on the clean /us/en/... delivery path.
function normalizePath(pathname) {
  let path = pathname.replace(/\.html$/, '');
  const prefix = PATH_PREFIXES.find((p) => path === p || path.startsWith(`${p}/`));
  if (prefix) path = path.slice(prefix.length) || '/';
  return path;
}

// Expose the shared locale query index as a path -> title Map. Backed by the
// query-index service, so the index is fetched once per page load and reused;
// on failure the service returns an empty list and crumbs fall back to slugs.
async function fetchPageMap() {
  const entries = await loadQueryIndex();
  return new Map(entries.map((p) => [p.path, p.title]));
}

// Title-case a URL slug, e.g. "press-releases" -> "Press Releases".
function titleCaseSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function createBreadcrumb(homeLabel) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ul = document.createElement('ul');
  nav.append(ul);

  const currentPath = normalizePath(window.location.pathname).replace(/\/$/, '');
  const parts = currentPath.split('/').filter(Boolean);
  // Locale root is the first two segments, e.g. /us/en.
  const localeRoot = `/${parts.slice(0, 2).join('/')}`;
  const pageMap = await fetchPageMap();

  const crumbs = [];

  // Home crumb: index-driven (/us/en/home), falling back to the authored label.
  const homePath = `${localeRoot}/home`;
  crumbs.push({ path: homePath, label: pageMap.get(homePath) || homeLabel });

  // Ancestors + current page: every segment below the locale root, labeled from
  // the index where available, else a title-cased slug (no dropped crumbs).
  for (let i = 3; i <= parts.length; i += 1) {
    const path = `/${parts.slice(0, i).join('/')}`;
    const label = pageMap.get(path) || titleCaseSlug(parts[i - 1]);
    crumbs.push({ path, label });
  }

  // Show every level of the trail (no length cap). The last crumb is the
  // current page and is rendered as plain text (no link); all ancestors link.
  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    const isLast = i === crumbs.length - 1;
    if (isLast) {
      li.className = 'active';
      li.textContent = crumb.label;
    } else {
      const a = document.createElement('a');
      a.href = crumb.path;
      a.textContent = crumb.label;
      li.append(a);
    }
    ul.append(li);
  });

  return nav;
}

export default async function decorate(block) {
  const homeLabel = block.textContent.trim() || 'Home';
  block.replaceChildren(await createBreadcrumb(homeLabel));
}
