// Breadcrumb — builds the trail from the current page path, labeling each crumb
// from the locale query index (/us/en/query-index.json) with a title-cased slug
// fallback for any ancestor not present in the index. One memoized index fetch
// serves every crumb.

const MAX_CRUMBS = 4;

let pageMapPromise;

// Fetch the locale query index once and expose it as a path -> title Map.
// On failure the cached promise is cleared so a later render can retry, and an
// empty Map is returned so crumbs fall back to slugs (never throws / never blank).
async function fetchPageMap(localeRoot) {
  if (!pageMapPromise) {
    pageMapPromise = fetch(`${localeRoot}/query-index.json`)
      .then((resp) => {
        if (!resp.ok) throw new Error(`query-index ${resp.status}`);
        return resp.json();
      })
      .then(({ data = [] }) => new Map(data.map((p) => [p.path, p.title])))
      .catch(() => {
        pageMapPromise = null; // don't cache the failure
        return new Map();
      });
  }
  return pageMapPromise;
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

  const currentPath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const parts = currentPath.split('/').filter(Boolean);
  // Locale root is the first two segments, e.g. /us/en.
  const localeRoot = `/${parts.slice(0, 2).join('/')}`;
  const pageMap = await fetchPageMap(localeRoot);

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

  const visible = crumbs.slice(0, MAX_CRUMBS);
  visible.forEach((crumb, i) => {
    const li = document.createElement('li');
    const isLast = i === visible.length - 1;
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
