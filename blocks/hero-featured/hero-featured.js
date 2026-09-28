// Hero Featured — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-featured.json):
//   Row 1: image  (imageAlt collapses into <img alt>)
//   Row 2: text   (richtext card: title, description, CTA)
//   Row 3: topic  (topicLink page picker; topicLinkText collapses into the link text)
// Presentation options are variant classes (never content rows):
//   full-width / align-left / align-right  -> layout (see CSS)
//   eyebrow-dynamic                        -> dynamicTopic
//
// Eyebrow behavior — the eyebrow always links to the authored topic page:
//   - dynamicTopic (eyebrow-dynamic class): topic is ignored and the title of
//     the topic page becomes the eyebrow text.
//   - Not dynamic, topic + topicLink populated: topic rendered as authored.
//   - Not dynamic, topic blank: the title of the topic page is used instead.
// The topic row is merged into the card so the block keeps its image + card DOM.
//
// Legacy content (no topic row; eyebrow authored inline as the first link of the
// text cell) is treated the same way, using that inline link as the topic.

// "/us/en/newsroom/negotiations-basics.html" -> "Negotiations Basics"
function nameFromPath(href) {
  const { pathname } = new URL(href, window.location.href);
  const segment = pathname.replace(/\.html$/, '').replace(/\/$/, '').split('/').pop() || '';
  return segment
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Resolve the title of the authored topic page. Falls back to a name built from
// its path when the page can't be fetched (missing, cross-origin, offline).
async function resolvePageTitle(href) {
  try {
    const resp = await fetch(href);
    if (resp.ok) {
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      const title = doc.querySelector('meta[property="og:title"]')?.content
        || doc.querySelector('title')?.textContent;
      if (title?.trim()) return title.trim();
    }
  } catch {
    // network/CORS error: use the fallback name
  }
  return nameFromPath(href);
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
  const [, textRow, topicRow] = block.children;
  const card = textRow?.querySelector(':scope > div') || textRow;
  if (!card) return;

  // Legacy inline eyebrow: a leading paragraph holding a single link, followed
  // by the rest of the card.
  const first = card.firstElementChild;
  const inlineEyebrow = first?.matches('p') && first.children.length === 1
    && first.querySelector(':scope > a') && first.nextElementSibling ? first : null;

  // The topic row (if any) replaces the inline eyebrow and is merged into the card.
  // Topic fields are edited from the block's properties panel, so the row carries
  // nothing the card needs.
  const topicAnchor = topicRow?.querySelector('a[href]');
  topicRow?.remove();

  const link = topicAnchor || inlineEyebrow?.querySelector('a');
  if (!link) return; // no topic authored: no eyebrow

  const topicLink = link.getAttribute('href');
  const text = link.textContent.trim();
  const topic = text && text !== topicLink && text !== link.href ? text : '';
  const dynamicTopic = block.classList.contains('eyebrow-dynamic');

  const eyebrow = inlineEyebrow || buildEyebrow();
  eyebrow.classList.add('button-container');
  const a = eyebrow.querySelector('a');
  a.classList.add('button');
  a.href = topicLink;
  a.textContent = !dynamicTopic && topic ? topic : await resolvePageTitle(topicLink);
  if (!inlineEyebrow) card.prepend(eyebrow);
}
