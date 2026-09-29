import { loadQueryIndex, normalizePath } from '../../scripts/query-index.js';

// Navigation Tabs — a row of links for navigating between related pages.
//
// Authoring model (see _navigation-tabs.json), one row per field:
//   tabsSource      "static" (default) | "dynamic"
//   navigationRoot  page picker (Dynamic only)
//   navigationTab   composite multi-field (Static only), each entry:
//                     label | link | target (true/false)
//   The multi-field renders its entries in one cell, separated by <hr> (or as a
//   <ul> of <li> when an entry is a single element).
//
// Static: one tab per navigationTab entry that has both a label and a link.
// Dynamic: one tab per direct child page of Navigation Root, read from the
//   shared query index. Label = the page title (without a " | site name"
//   suffix), else the page name; target = current window. The index is served
//   on the delivery tier only, so Dynamic tabs are empty in the author
//   environment.
//
// Each tab renders as <a href target rel?><span>label</span><i icon></a>.

// "Negotiations | About UPS" -> "Negotiations"
function stripSiteSuffix(title) {
  return title.replace(/\s+\|\s+[^|]*$/, '').trim() || title.trim();
}

// "/us/en/newsroom/industry-overview" -> "Industry Overview"
function nameFromPath(path) {
  return (path.split('/').pop() || '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildTab({ label, href, newWindow }) {
  const li = document.createElement('li');
  li.className = 'navigation-tabs-item';
  const a = document.createElement('a');
  a.className = 'navigation-tabs-link';
  a.href = href;
  a.target = newWindow ? '_blank' : '_self';
  if (newWindow) a.rel = 'noopener noreferrer';
  const span = document.createElement('span');
  span.textContent = label;
  const icon = document.createElement('i');
  icon.className = 'upspr-icon-arrowright-circle';
  icon.setAttribute('aria-hidden', 'true');
  a.append(span, icon);
  li.append(a);
  return li;
}

// Direct child pages of root (a delivery or /content/... path) from the index.
async function childPages(root) {
  const base = normalizePath(root);
  if (!base) return [];
  const entries = await loadQueryIndex();
  return entries
    .map((entry) => ({ entry, path: normalizePath(entry.path) }))
    .filter(({ path }) => path.startsWith(`${base}/`) && !path.slice(base.length + 1).includes('/'))
    .map(({ entry, path }) => ({
      label: entry.title?.trim() ? stripSiteSuffix(entry.title) : nameFromPath(path),
      href: entry.path,
      newWindow: false,
    }));
}

// Split a multi-field cell into entries: <hr>-separated groups of elements, or
// the <li> items of a list.
function multiFieldEntries(cell) {
  if (!cell) return [];
  const list = cell.querySelector(':scope > ul');
  if (list && !cell.querySelector(':scope > hr')) {
    return [...list.children].map((li) => [li]);
  }
  const entries = [[]];
  [...cell.children].forEach((el) => {
    if (el.tagName === 'HR') entries.push([]);
    else entries[entries.length - 1].push(el);
  });
  return entries.filter((entry) => entry.length);
}

const isBoolean = (text) => /^(true|false)$/i.test(text);

// One navigationTab entry -> { label, href, newWindow } (null when incomplete).
function staticTab(elements) {
  const link = elements
    .map((el) => (el.matches('a[href]') ? el : el.querySelector('a[href]')))
    .find(Boolean);
  const texts = elements
    .filter((el) => !el.matches('a') && !el.querySelector('a'))
    .map((el) => el.textContent.trim())
    .filter(Boolean);
  const label = texts.find((text) => !isBoolean(text));
  const href = link?.getAttribute('href');
  if (!label || !href) return null; // both are required
  return { label, href, newWindow: texts.some((text) => text.toLowerCase() === 'true') };
}

// Rows follow the model order (tabsSource, navigationRoot, navigationTab); fall
// back to matching by content when empty fields are left out.
function splitRows(rows) {
  if (rows.length === 3) return rows;
  const sourceRow = rows.find((row) => /^(static|dynamic)$/i.test(row.textContent.trim()));
  const rest = rows.filter((row) => row !== sourceRow);
  const tabsRow = rest.find((row) => row.querySelector('hr, ul'));
  const rootRow = rest.find((row) => row !== tabsRow && row.querySelector('a[href]'));
  return [sourceRow, rootRow, tabsRow];
}

export default async function decorate(block) {
  const [sourceRow, rootRow, tabsRow] = splitRows([...block.children]);
  const dynamic = sourceRow?.textContent.trim().toLowerCase() === 'dynamic';

  const tabs = dynamic
    ? await childPages(rootRow?.querySelector('a[href]')?.getAttribute('href'))
    : multiFieldEntries(tabsRow?.firstElementChild || tabsRow).map(staticTab).filter(Boolean);

  const ul = document.createElement('ul');
  ul.className = 'navigation-tabs-list';
  tabs.forEach((tab) => ul.append(buildTab(tab)));
  block.replaceChildren(ul);
}
