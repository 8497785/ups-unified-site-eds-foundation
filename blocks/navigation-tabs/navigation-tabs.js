import { moveInstrumentation } from '../../scripts/scripts.js';
import { loadQueryIndex, normalizePath } from '../../scripts/query-index.js';

// Navigation Tabs — a row of links for navigating between related pages.
//
// Authoring model (see _navigation-tabs.json):
//   Block rows (one cell each):
//     tabsSource      "static" (default) | "dynamic"
//     navigationRoot  page picker (Dynamic only)
//   Item rows (Navigation Tab, three cells): label | link | target (true/false)
//
// Static: one tab per Navigation Tab item.
// Dynamic: one tab per direct child page of Navigation Root; target = current
//   window.
//   - AEM author / Universal Editor: listed from AEM (<root>.2.json), labelled
//     pageTitle, else navTitle, else the page title, else the page name.
//   - Delivery (*.aem.page / *.aem.live), or when AEM is not reachable: read
//     from the shared query index, labelled with the page title (without a
//     " | site name" suffix), else the page name. The index only holds
//     published pages (paths.json: /us/en), so e.g. language-masters roots
//     have no tabs there.
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

// The query index is only served on the EDS delivery tiers (same rule as
// scripts/config.js); everywhere else (AEM author / Universal Editor) child pages
// are listed straight from AEM.
const isDeliveryTier = () => /\.aem\.(page|live)$/.test(window.location.hostname);

// Direct child pages of a /content/... root from AEM author (<root>.2.json holds
// each child page and its jcr:content). Label: pageTitle, else navTitle, else
// the page title, else the page name. Keeps AEM's page order. Empty on any
// failure, e.g. when AEM is not reachable from this origin.
async function authorChildPages(root) {
  const base = (root || '').trim().replace(/\.html$/, '').replace(/\/$/, '');
  if (!base.startsWith('/content/')) return [];
  try {
    const resp = await fetch(`${base}.2.json`, { credentials: 'same-origin' });
    if (!resp.ok) return [];
    const json = await resp.json();
    return Object.entries(json)
      .filter(([, node]) => node && node['jcr:primaryType'] === 'cq:Page')
      .map(([name, node]) => {
        const content = node['jcr:content'] || {};
        const title = [content.pageTitle, content.navTitle, content['jcr:title']]
          .find((value) => typeof value === 'string' && value.trim());
        return {
          label: title ? title.trim() : nameFromPath(name),
          href: `${base}/${name}.html`,
          newWindow: false,
        };
      });
  } catch {
    return [];
  }
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

export default async function decorate(block) {
  const rows = [...block.children];
  const itemRows = rows.filter((row) => row.children.length > 1);
  const configRows = rows.filter((row) => row.children.length <= 1);

  const sourceRow = configRows.find((row) => /^(static|dynamic)$/i.test(row.textContent.trim()));
  const rootRow = configRows.find((row) => row.querySelector('a[href]'));
  const dynamic = sourceRow?.textContent.trim().toLowerCase() === 'dynamic';

  const ul = document.createElement('ul');
  ul.className = 'navigation-tabs-list';

  if (dynamic) {
    const root = rootRow?.querySelector('a[href]').getAttribute('href');
    let tabs = isDeliveryTier() ? [] : await authorChildPages(root);
    if (!tabs.length) tabs = await childPages(root);
    tabs.forEach((tab) => ul.append(buildTab(tab)));
  } else {
    itemRows.forEach((row) => {
      const [labelCell, linkCell, targetCell] = row.children;
      const label = labelCell?.textContent.trim();
      const href = linkCell?.querySelector('a[href]')?.getAttribute('href');
      if (!label || !href) return; // both are required
      const li = buildTab({
        label,
        href,
        newWindow: /^(true|yes|on)$/i.test(targetCell?.textContent.trim() || ''),
      });
      moveInstrumentation(row, li);
      ul.append(li);
    });
  }

  block.replaceChildren(ul);
}
