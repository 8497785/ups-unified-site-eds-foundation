/**
 * Title-case a URL slug, e.g. "our-company" -> "Our Company".
 */
function titleCaseSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Resolve a human label for a path: prefer the target page's title
 * (via its .plain.html metadata), fall back to the title-cased slug.
 */
async function resolveLabel(path, slug) {
  try {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = [...doc.querySelectorAll('.metadata > div')];
      const titleRow = rows.find((r) => r.children[0]
        && r.children[0].textContent.trim().toLowerCase() === 'title');
      if (titleRow && titleRow.children[1]) {
        // Strip any " | About UPS" suffix to keep the crumb short.
        return titleRow.children[1].textContent.split('|')[0].trim();
      }
    }
  } catch (e) {
    // ignore and fall back
  }
  return titleCaseSlug(slug);
}

export default async function decorate(block) {
  const homeLabel = block.textContent.trim() || 'Home';

  const segments = window.location.pathname
    .replace(/\.html$/, '')
    .split('/')
    .filter(Boolean);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ul = document.createElement('ul');

  // Home crumb always first.
  const homeLi = document.createElement('li');
  const homeA = document.createElement('a');
  homeA.href = '/';
  homeA.textContent = homeLabel;
  homeLi.append(homeA);
  ul.append(homeLi);

  // Create each crumb's <li> synchronously to lock the order, then fill labels.
  const crumbs = segments.map((slug, i) => {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const isLast = i === segments.length - 1;
    const li = document.createElement('li');
    let target;
    if (isLast) {
      li.className = 'active';
      li.textContent = titleCaseSlug(slug);
      target = li;
    } else {
      const a = document.createElement('a');
      a.href = path;
      a.textContent = titleCaseSlug(slug);
      li.append(a);
      target = a;
    }
    ul.append(li);
    return { slug, path, target };
  });

  nav.append(ul);
  block.replaceChildren(nav);

  // Upgrade labels from ancestor page titles where available.
  await Promise.all(crumbs.map(async ({ slug, path, target }) => {
    const label = await resolveLabel(path, slug);
    if (label) target.textContent = label;
  }));
}
