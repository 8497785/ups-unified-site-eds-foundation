/**
 * Shared query-index service.
 *
 * There is ONE global query index for the locale — /us/en/query-index.json —
 * that carries the full article properties (title, description, image,
 * published, category, categoryUrl, ...). Every block (content lists, related
 * articles, global search, breadcrumb) reads from this single index and filters
 * it in memory by field, rather than maintaining per-section indexes.
 *
 * The index is fetched at most ONCE per page load: the fetch Promise is
 * memoized at module scope, so any number of blocks sharing this module reuse
 * the same in-flight/resolved result with no extra network requests.
 *
 * The query index is a delivery-tier artifact (served on *.aem.page /
 * *.aem.live), so a failed fetch (e.g. in the author environment) resolves to
 * an empty list — callers render placeholders/empty state accordingly.
 */

export const LOCALE_INDEX = '/us/en/query-index.json';

// Module-level memoized store: the single shared Promise for the loaded index.
let indexPromise = null;

/**
 * Load the locale query index, fetching it at most once per page load.
 * Subsequent calls reuse the memoized Promise. Resolves to the array of
 * entries (empty array on any failure).
 *
 * @returns {Promise<Array<Object>>} the query-index entries
 */
export function loadQueryIndex() {
  if (!indexPromise) {
    indexPromise = fetch(LOCALE_INDEX)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Normalize a path for comparison: strip a leading /content/<site> pair,
 * the .html suffix, and any trailing slash. Delivery paths are already public
 * (e.g. /us/en/newsroom/press-releases/customer-first).
 *
 * @param {string} p a raw path or href
 * @returns {string} the normalized delivery path
 */
export function normalizePath(p) {
  let out = (p || '').trim().replace(/\.html$/, '').replace(/\/$/, '');
  if (out.startsWith('/content/')) out = `/${out.split('/').slice(3).join('/')}`;
  return out;
}

/**
 * Return a comparator for a sort key. Entries without a valid published date
 * sort last for date-based orders.
 *   'title'  — alphabetical by title
 *   'oldest' — oldest published first
 *   default  — newest published first
 *
 * @param {string} sort sort key
 * @returns {(a: Object, b: Object) => number} comparator
 */
export function comparatorFor(sort) {
  if (sort === 'title') {
    return (a, b) => (a.title || '').localeCompare(b.title || '');
  }
  const dir = sort === 'oldest' ? -1 : 1;
  return (a, b) => {
    const ta = Date.parse(a.published || '');
    const tb = Date.parse(b.published || '');
    const va = Number.isNaN(ta) ? -Infinity : ta;
    const vb = Number.isNaN(tb) ? -Infinity : tb;
    return (vb - va) * dir;
  };
}

/**
 * Retrieve entries from the shared locale index, filtered/sorted in memory.
 *
 * @param {Object} [opts]
 * @param {string} [opts.pathPrefix]      keep entries whose path starts with this prefix
 * @param {boolean} [opts.directChildren] with pathPrefix, keep only direct children
 *                                         (no deeper descendants)
 * @param {boolean} [opts.publishedOnly=true] keep only entries with a published date
 *                                         (excludes section/category landing pages)
 * @param {string} [opts.excludePath]     drop the entry matching this path (normalized)
 * @param {Array<string>} [opts.paths]    keep only entries whose path matches one of
 *                                         these (order preserved to match input)
 * @param {string} [opts.sort]            sort key for comparatorFor
 * @param {number} [opts.limit]           cap the number of returned entries
 * @returns {Promise<Array<Object>>} the filtered entries
 */
export async function getEntries({
  pathPrefix,
  directChildren = false,
  publishedOnly = true,
  excludePath,
  paths,
  sort,
  limit = 0,
} = {}) {
  const all = await loadQueryIndex();

  // Explicit path list: return matching entries in the requested order.
  if (paths && paths.length) {
    const wanted = paths.map(normalizePath);
    const byPath = new Map(all.map((e) => [normalizePath(e.path), e]));
    return wanted.map((p) => byPath.get(p)).filter(Boolean);
  }

  let entries = all;

  if (pathPrefix) {
    const prefix = normalizePath(pathPrefix);
    entries = entries.filter((e) => {
      const p = normalizePath(e.path);
      if (!p.startsWith(`${prefix}/`)) return false;
      if (directChildren && p.slice(prefix.length + 1).includes('/')) return false;
      return true;
    });
  }

  if (publishedOnly) {
    entries = entries.filter((e) => e.published);
  }

  if (excludePath) {
    const ex = normalizePath(excludePath);
    entries = entries.filter((e) => normalizePath(e.path) !== ex);
  }

  if (sort) {
    entries = [...entries].sort(comparatorFor(sort));
  }

  if (limit > 0) {
    entries = entries.slice(0, limit);
  }

  return entries;
}
