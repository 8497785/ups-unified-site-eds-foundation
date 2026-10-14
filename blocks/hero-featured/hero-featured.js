// Hero Featured — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-featured.json), rows in field order:
//   Row 1: image      (imageAlt collapses into <img alt>)
//   Row 2: topic      (static eyebrow text)
//   Row 3: topicLink  (static eyebrow link)
//   Row 4: text       (richtext card: title, description)
//   Row 5: link       (ctaLink page picker; ctaLinkText collapses into the link text)
// Older content may have text as row 2 (previous field order) — see splitRows().
// Block options (classes group, never content rows), "Styles" tab:
//   classes                  align-left / align-right -> card side (see CSS)
//   classes_rounded-corners  boolean -> rounded-corners
// and on the Content tab:
//   classes_eyebrow          eyebrow-dynamic / eyebrow-static / eyebrow-none
//
// CTA: links to ctaLink with the text ctaLinkText. It renders only when both are
// authored; there is no default text, so translated pages never show a
// hardcoded label.
// Eyebrow:
//   - Dynamic (default): links to the parent page of ctaLink and shows that
//     parent page's name. Topic fields are ignored.
//   - Static: shows the authored topic and links to the authored topicLink.
//     A blank topic shows the name of the linked page; a blank topicLink falls
//     back to the parent page of ctaLink.
//   - None: no eyebrow (a legacy inline eyebrow in the text cell is removed too).
//   Content without a saved mode (e.g. imported) is static when a topic or
//   topicLink is present, otherwise dynamic.
// The field rows are merged into the card so the block keeps its image + card DOM.
//
// Legacy content (no field rows; eyebrow and CTA authored inline as the first
// and last links of the text cell) renders as authored.

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

// "Negotiations | About UPS" -> "Negotiations": drop a trailing " | site name".
function stripSiteSuffix(title) {
  return title.replace(/\s+\|\s+[^|]*$/, '').trim() || title.trim();
}

// Resolve a page's name (its title, without a site-name suffix). Falls back to a
// name built from its path when the page can't be fetched (missing,
// cross-origin, offline).
async function resolvePageTitle(href) {
  try {
    const resp = await fetch(href);
    if (resp.ok) {
      const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
      const title = doc.querySelector('meta[property="og:title"]')?.content
        || doc.querySelector('title')?.textContent;
      if (title?.trim()) return stripSiteSuffix(title);
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

// The richtext Text cell holds a heading, a list or several blocks; the
// plain-text topic never does.
const isRich = (row) => {
  const cell = row?.firstElementChild || row;
  return !!cell && (cell.children.length > 1 || !!cell.querySelector('h1, h2, h3, h4, h5, h6, ul, ol'));
};
const hasLink = (row) => !!row.querySelector('a[href]');

// Split the rows after the image into text / topic / topicLink / link.
//   [text]                              legacy (eyebrow and CTA inline in text)
//   [topic, topicLink, text, link]      current model order
//   [text, topic, topicLink, link]      previous model order (older content)
// With fields left out, rows are matched by content instead: the rich row is
// the text, a remaining text-only row the topic, and link rows are topicLink
// then link (a lone link row being the CTA link).
function splitRows(rows) {
  if (rows.length <= 1) return { textRow: rows[0], fieldRows: [] };
  if (rows.length === 4) {
    const [a, b, c, d] = rows;
    const previousOrder = isRich(a) && !isRich(c);
    return previousOrder
      ? {
        textRow: a, topicRow: b, topicLinkRow: c, linkRow: d, fieldRows: [b, c, d],
      }
      : {
        textRow: c, topicRow: a, topicLinkRow: b, linkRow: d, fieldRows: [a, b, d],
      };
  }
  const textRow = rows.find(isRich)
    || rows.filter((row) => !hasLink(row) && row.textContent.trim()).pop()
    || rows[0];
  const fieldRows = rows.filter((row) => row !== textRow);
  const linkRows = fieldRows.filter(hasLink);
  const topicRow = fieldRows.find((row) => !hasLink(row) && row.textContent.trim());
  const [topicLinkRow, linkRow] = linkRows.length > 1 ? linkRows : [undefined, linkRows[0]];
  return {
    textRow, topicRow, topicLinkRow, linkRow, fieldRows,
  };
}

export default async function decorate(block) {
  const [, ...rows] = block.children;
  const {
    textRow, topicRow, topicLinkRow, linkRow, fieldRows,
  } = splitRows(rows);
  const card = textRow?.querySelector(':scope > div') || textRow;
  if (!card) return;

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
  const noEyebrow = has('eyebrow-none');
  if (noEyebrow) inlineEyebrow?.remove();

  if (!ctaAnchor && !topicAnchor && !topic) {
    // Legacy: keep the inline links as authored.
    const link = !noEyebrow && inlineEyebrow?.querySelector('a');
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

  // CTA: the authored link, only when both link and text are authored.
  if (ctaAnchor && authoredText(ctaAnchor)) {
    place(card, toButton(ctaAnchor), inlineCta, 'append');
  }

  if (noEyebrow || !eyebrowAnchor) {
    inlineEyebrow?.remove(); // eyebrow turned off, or nothing to link it to
    return;
  }
  eyebrowAnchor.textContent = isStatic && topic
    ? topic
    : await resolvePageTitle(eyebrowAnchor.getAttribute('href'));
  place(card, toButton(eyebrowAnchor), inlineEyebrow, 'prepend');
}
