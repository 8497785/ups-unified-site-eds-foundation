// Hero Featured — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-featured.json):
//   Row 1: image      (imageAlt collapses into <img alt>)
//   Row 2: text       (richtext card: title, description)
//   Row 3: topic      (static eyebrow text)
//   Row 4: topicLink  (static eyebrow link)
//   Row 5: link       (ctaLink page picker; ctaLinkText collapses into the link text)
// Block options (classes group, never content rows):
//   classes          full-width / align-left / align-right  -> layout (see CSS)
//   classes_eyebrow  eyebrow-dynamic / eyebrow-static        -> eyebrow mode
//
// CTA: links to ctaLink; text is ctaLinkText, or "Read more" when blank.
// Eyebrow:
//   - Dynamic (default): links to the parent page of ctaLink and shows that
//     parent page's name. Topic fields are ignored.
//   - Static: shows the authored topic and links to the authored topicLink.
//     A blank topic shows the name of the linked page; a blank topicLink falls
//     back to the parent page of ctaLink.
//   Content without a saved mode (e.g. imported) is static when a topic or
//   topicLink is present, otherwise dynamic.
// The field rows are merged into the card so the block keeps its image + card DOM.
//
// Legacy content (no field rows; eyebrow and CTA authored inline as the first
// and last links of the text cell) renders as authored.

const DEFAULT_CTA_TEXT = 'Read more';

// "/us/en/newsroom/negotiations/story.html" -> "/us/en/newsroom/negotiations.html"
// (absolute URLs keep their origin). Returns null at the site root.
function parentHref(href) {
  const url = new URL(href, window.location.href);
  const ext = url.pathname.endsWith('.html') ? '.html' : '';
  const path = url.pathname.replace(/\.html$/, '').replace(/\/(index)?$/, '');
  const parent = path.substring(0, path.lastIndexOf('/'));
  if (!parent) return null;
  const sameOrigin = url.origin === window.location.origin;
  return `${sameOrigin ? '' : url.origin}${parent}${ext}`;
}

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

// Resolve a page's name (its title). Falls back to a name built from its path
// when the page can't be fetched (missing, cross-origin, offline).
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

// Authored link text, or '' when left blank (the link then renders its URL).
function authoredText(a) {
  const text = a.textContent.trim();
  return text && text !== a.getAttribute('href') && text !== a.href ? text : '';
}

// A paragraph holding a single link (an inline eyebrow or CTA).
function isLinkParagraph(el) {
  return el?.matches('p') && el.children.length === 1 && !!el.querySelector(':scope > a');
}

// Wrap a link in the `.button-container > a.button` structure the CSS styles
// (first child = eyebrow, last child = CTA). The link element itself is reused
// so attributes set during page decoration (e.g. target/rel) are kept.
function toButton(a) {
  let container = a.parentElement;
  if (!container?.matches('p') || container.children.length !== 1) {
    container = document.createElement('p');
    container.append(a);
  }
  container.classList.add('button-container');
  a.classList.add('button');
  return container;
}

// Place a button in the card, replacing the legacy inline one.
function place(card, button, inline, where) {
  if (inline) inline.replaceWith(button);
  else card[where](button);
}

// Split the rows after text into topic / topicLink / link. They are positional
// when all three are present; otherwise (older content, or empty fields left
// out) they are matched by content: the text-only row is the topic and link rows
// are topicLink then link, a lone link row being the CTA link.
function splitFieldRows(rows) {
  if (rows.length === 3) return rows;
  const hasLink = (row) => !!row.querySelector('a[href]');
  const linkRows = rows.filter(hasLink);
  const topicRow = rows.find((row) => !hasLink(row) && row.textContent.trim());
  const [topicLinkRow, linkRow] = linkRows.length > 1 ? linkRows : [undefined, linkRows[0]];
  return [topicRow, topicLinkRow, linkRow];
}

export default async function decorate(block) {
  const [, textRow, ...fieldRows] = block.children;
  const card = textRow?.querySelector(':scope > div') || textRow;
  if (!card) return;
  const [topicRow, topicLinkRow, linkRow] = splitFieldRows(fieldRows);

  // Legacy inline eyebrow / CTA: leading and trailing single-link paragraphs.
  const first = card.firstElementChild;
  const last = card.lastElementChild;
  const inlineEyebrow = isLinkParagraph(first) && first.nextElementSibling ? first : null;
  const inlineCta = isLinkParagraph(last) && last !== inlineEyebrow ? last : null;

  // The fields are edited from the block's properties panel, so their rows carry
  // nothing else the card needs.
  const topic = topicRow?.textContent.trim() || '';
  const topicAnchor = topicLinkRow?.querySelector('a[href]');
  const ctaAnchor = linkRow?.querySelector('a[href]');
  fieldRows.forEach((row) => row.remove());

  const has = (cls) => block.classList.contains(cls);

  if (!ctaAnchor && !topicAnchor && !topic) {
    // Legacy: keep the inline links as authored.
    const link = inlineEyebrow?.querySelector('a');
    if (link && (has('eyebrow-dynamic') || !authoredText(link))) {
      link.textContent = await resolvePageTitle(link.getAttribute('href'));
    }
    return;
  }

  const parent = ctaAnchor ? parentHref(ctaAnchor.getAttribute('href')) : null;
  const isStatic = has('eyebrow-static')
    || (!has('eyebrow-dynamic') && !!(topic || topicAnchor));

  // Eyebrow link: the authored topicLink (static), otherwise a copy of the CTA
  // link (keeping target/rel) pointed at its parent page.
  let eyebrowAnchor = isStatic ? topicAnchor : null;
  if (!eyebrowAnchor && parent) {
    eyebrowAnchor = ctaAnchor.cloneNode(false);
    eyebrowAnchor.href = parent;
  }

  // CTA: the authored link.
  if (ctaAnchor) {
    ctaAnchor.textContent = authoredText(ctaAnchor) || DEFAULT_CTA_TEXT;
    place(card, toButton(ctaAnchor), inlineCta, 'append');
  }

  if (!eyebrowAnchor) {
    inlineEyebrow?.remove(); // nothing to link the eyebrow to
    return;
  }
  eyebrowAnchor.textContent = isStatic && topic
    ? topic
    : await resolvePageTitle(eyebrowAnchor.getAttribute('href'));
  place(card, toButton(eyebrowAnchor), inlineEyebrow, 'prepend');
}
