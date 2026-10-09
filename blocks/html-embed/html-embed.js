/*
 * HTML Embed block — renders an author-pasted HTML snippet (with optional
 * <style> and <script>) in an isolated, auto-sized frame.
 *
 * Why a frame: the snippet's CSS must not leak into the page (and the page's
 * CSS must not restyle the snippet), while pasted scripts must still find
 * their own elements via `document`. An iframe document gives both.
 *
 * - The frame inherits the site font, text color and size from the block.
 * - Links open in the main window (<base target="_top">).
 * - The page's Content Security Policy also applies to the frame, so every
 *   pasted <script> gets the page's nonce; scripts those load are then
 *   trusted too ('strict-dynamic').
 * - The frame height follows its content (ResizeObserver).
 */

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

// Code pasted as text into the editor arrives escaped (the cell's text holds
// "<div>…" characters), split over paragraphs, line breaks or a code block.
const TAG_AS_TEXT = /<\/?[a-z][\w-]*[\s\S]*?>|<!--/i;

function textOf(cell) {
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  const parts = [...clone.children].length
    ? [...clone.children].map((el) => el.textContent)
    : [clone.textContent];
  return parts.join('\n').trim();
}

// Elements the editor itself wraps typed/pasted text in.
const TEXT_WRAPPERS = new Set(['P', 'BR', 'PRE', 'CODE']);

// The snippet field is rich text with `unsupportedHtml` on, so it can arrive
// two ways:
// - as real markup kept by the editor (any element besides the text
//   wrappers above): use the cell's HTML as is;
// - as code pasted as text (escaped "<div>…" characters inside paragraphs,
//   line breaks or a code block): rebuild the text, keeping line breaks.
export function readSnippet(block) {
  const cell = block.querySelector(':scope > div > div') || block;
  const markup = [...cell.querySelectorAll('*')].some((el) => !TEXT_WRAPPERS.has(el.tagName));
  if (markup) return cell.innerHTML.trim();
  const text = textOf(cell);
  if (!text) return '';
  return TAG_AS_TEXT.test(text) ? text : cell.innerHTML.trim();
}

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// The page's CSP nonce (random per response). The `nonce` property keeps the
// value even though browsers hide the attribute.
function pageNonce() {
  const script = document.querySelector('script[nonce]');
  return script ? script.nonce || script.getAttribute('nonce') : '';
}

// Give every pasted <script> the page nonce (replacing any nonce it had).
export function addNonce(html, nonce) {
  if (!nonce) return html;
  return html.replace(/<script\b([^>]*)>/gi, (m, attrs) => {
    const rest = attrs.replace(/\snonce\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, '');
    return `<script nonce="${escapeAttr(nonce)}"${rest}>`;
  });
}

export function buildDocument(snippet, { font, nonce, fontLinks = [] }) {
  const links = fontLinks.map((href) => `<link rel="stylesheet" href="${escapeAttr(href)}">`).join('');
  const base = `html,body{margin:0;padding:0;background:transparent}body{display:flow-root;font-family:${font.family};font-size:${font.size};line-height:${font.lineHeight};color:${font.color}}img,video,iframe{max-width:100%}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_top">${links}<style>${base}</style></head><body>${addNonce(snippet, nonce)}</body></html>`;
}

// Keep the frame as tall as its content (content may change after scripts
// run or images load).
function autoSize(frame) {
  const doc = frame.contentDocument;
  if (!doc || !doc.body) return;
  const fit = () => { frame.style.height = `${Math.ceil(doc.body.getBoundingClientRect().height)}px`; };
  fit();
  const RO = frame.contentWindow.ResizeObserver || window.ResizeObserver;
  if (RO) new RO(fit).observe(doc.body);
}

export default function decorate(block) {
  const snippet = readSnippet(block);

  if (!snippet) {
    if (isAuthorEnvironment()) {
      const notice = document.createElement('p');
      notice.className = 'html-embed-notice';
      notice.textContent = 'Paste an HTML snippet in the HTML Snippet field to see it here.';
      block.replaceChildren(notice);
    } else {
      block.replaceChildren();
    }
    return;
  }

  const cs = getComputedStyle(block);
  const fontLinks = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')]
    .map((l) => l.href);

  const frame = document.createElement('iframe');
  frame.className = 'html-embed-frame';
  frame.title = 'Embedded content';
  frame.addEventListener('load', () => autoSize(frame));
  frame.srcdoc = buildDocument(snippet, {
    font: {
      family: cs.fontFamily, size: cs.fontSize, lineHeight: cs.lineHeight, color: cs.color,
    },
    nonce: pageNonce(),
    fontLinks,
  });
  block.replaceChildren(frame);
}
