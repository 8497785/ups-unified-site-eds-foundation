// Hero Featured — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-featured.json) keeps the hero 3-row convention:
//   Row 1: image  (imageAlt collapses into <img alt>)
//   Row 2: text   (richtext card: eyebrow link, title, description, CTA)
// Presentation options are variant classes (never content rows):
//   full-width / align-left / align-right  -> layout (see CSS)
//   eyebrow-dynamic                        -> dynamicTopic
//
// Eyebrow (topic) behavior — the eyebrow is the first link in the text cell:
// its text is the topic, its href is the topicLink.
//   - dynamicTopic (eyebrow-dynamic class): topic is ignored and the parent
//     page name becomes the eyebrow text (linked to topicLink, else the parent).
//   - Not dynamic, topic + topicLink populated: rendered exactly as authored.
//   - Not dynamic, topic blank (link text empty or just the URL): the parent
//     page name is used instead.
//
// Legacy content (image + inline-eyebrow text, no variant class) renders exactly
// as before.

// "/us/en/newsroom/negotiations(.html)" -> { path: "/us/en/newsroom", ext: "" }
function getParentPath() {
  const { pathname } = window.location;
  const ext = pathname.endsWith('.html') ? '.html' : '';
  const path = pathname.replace(/\.html$/, '').replace(/\/(index)?$/, '');
  const parent = path.substring(0, path.lastIndexOf('/'));
  return parent ? { path: parent, ext } : null;
}

// "negotiations-basics" -> "Negotiations Basics"
function humanize(segment) {
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Resolve the parent page's name (its title) and URL. Falls back to the
// humanized path segment when the parent page can't be fetched.
async function resolveParentPage() {
  const parent = getParentPath();
  if (!parent) return null;
  const href = `${parent.path}${parent.ext}`;
  const fallback = humanize(parent.path.substring(parent.path.lastIndexOf('/') + 1));

  try {
    const resp = await fetch(href);
    if (resp.ok) {
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      const title = doc.querySelector('meta[property="og:title"]')?.content
        || doc.querySelector('title')?.textContent;
      if (title?.trim()) return { title: title.trim(), href };
    }
  } catch {
    // network error: use the fallback name
  }
  return fallback ? { title: fallback, href } : null;
}

// Build an eyebrow element matching the existing `.button-container:first-child
// a.button` styling.
function buildEyebrow() {
  const container = document.createElement('p');
  container.className = 'button-container';
  const a = document.createElement('a');
  a.className = 'button';
  container.append(a);
  return container;
}

export default async function decorate(block) {
  const card = block.lastElementChild?.querySelector(':scope > div')
    || block.lastElementChild;
  if (!card) return;

  // The authored eyebrow: a leading paragraph holding a single link.
  const first = card.firstElementChild;
  const eyebrow = first?.matches('p') && first.children.length === 1 && first.querySelector(':scope > a')
    ? first : null;
  const link = eyebrow?.querySelector('a');
  const topicLink = link?.getAttribute('href') || '';
  const text = link?.textContent.trim() || '';
  const topic = text && text !== topicLink && text !== link.href ? text : '';

  const dynamicTopic = block.classList.contains('eyebrow-dynamic');
  if (!dynamicTopic && (topic || !link)) return; // static: leave as authored

  const parentPage = await resolveParentPage();
  if (!parentPage) return; // no parent (site root): keep whatever was authored

  const target = eyebrow || buildEyebrow();
  const a = target.querySelector('a');
  a.textContent = parentPage.title;
  a.href = topicLink || parentPage.href;
  if (!eyebrow) card.prepend(target);
}
