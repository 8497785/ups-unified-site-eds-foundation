// Hero Featured — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-featured.json):
//   Row 1: image  (imageAlt collapses into <img alt>)
//   Row 2: text   (richtext card: title, description)
//   Row 3: topic  (optional eyebrow text)
//   Row 4: link   (ctaLink page picker; ctaLinkText collapses into the link text)
// Presentation options are variant classes (never content rows):
//   full-width / align-left / align-right  -> layout (see CSS)
//   eyebrow-dynamic                        -> dynamicTopic
//
// One authored link drives both links in the card:
//   - CTA: links to ctaLink; text is ctaLinkText, or "Read more" when blank.
//   - Eyebrow: links to the parent page of ctaLink.
//       dynamicTopic (eyebrow-dynamic class): topic is ignored and the parent
//         page name becomes the eyebrow text.
//       Not dynamic, topic populated: topic rendered as authored.
//       Not dynamic, topic blank: the parent page name is used instead.
// The topic and link rows are merged into the card so the block keeps its
// image + card DOM.
//
// Legacy content (no topic/link rows; eyebrow and CTA authored inline as the
// first and last links of the text cell) keeps both inline links; the eyebrow
// text follows the same topic rules using the page the inline eyebrow links to.

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

export default async function decorate(block) {
  // Rows after text are matched by content (the link row holds the link), so
  // content authored before these fields existed, or with empty fields left
  // out, still resolves correctly.
  const [, textRow, ...fieldRows] = block.children;
  const card = textRow?.querySelector(':scope > div') || textRow;
  if (!card) return;
  const linkRow = fieldRows.find((row) => row.querySelector('a[href]'));
  const topicRow = fieldRows.find((row) => row !== linkRow);

  // Legacy inline eyebrow / CTA: leading and trailing single-link paragraphs.
  const first = card.firstElementChild;
  const last = card.lastElementChild;
  const inlineEyebrow = isLinkParagraph(first) && first.nextElementSibling ? first : null;
  const inlineCta = isLinkParagraph(last) && last !== inlineEyebrow ? last : null;

  // Topic and link fields are edited from the block's properties panel, so their
  // rows carry nothing else the card needs.
  const topic = topicRow?.textContent.trim() || '';
  const ctaAnchor = linkRow?.querySelector('a[href]');
  fieldRows.forEach((row) => row.remove());

  const dynamicTopic = block.classList.contains('eyebrow-dynamic');

  if (!ctaAnchor) {
    // Legacy: keep the inline links; the eyebrow text follows the topic rules.
    const link = inlineEyebrow?.querySelector('a');
    if (link && (dynamicTopic || !authoredText(link))) {
      link.textContent = await resolvePageTitle(link.getAttribute('href'));
    }
    return;
  }

  // Eyebrow: a copy of the authored link (keeping target/rel) pointed at its parent.
  const parent = parentHref(ctaAnchor.getAttribute('href'));
  const eyebrowAnchor = parent ? ctaAnchor.cloneNode(false) : null;

  // CTA: the authored link.
  ctaAnchor.textContent = authoredText(ctaAnchor) || DEFAULT_CTA_TEXT;
  place(card, toButton(ctaAnchor), inlineCta, 'append');

  if (!eyebrowAnchor) {
    inlineEyebrow?.remove(); // link at the site root: no parent page to point to
    return;
  }
  eyebrowAnchor.href = parent;
  eyebrowAnchor.textContent = !dynamicTopic && topic ? topic : await resolvePageTitle(parent);
  place(card, toButton(eyebrowAnchor), inlineEyebrow, 'prepend');
}
