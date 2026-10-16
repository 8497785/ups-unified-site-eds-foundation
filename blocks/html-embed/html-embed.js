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
 * - Edge Delivery media images in the snippet are optimized, and relative
 *   /content/dam/... references are loaded from the public DAM host (below).
 *
 * "Render inline (no frame)" (second field): the snippet is added straight into
 * the page instead, via createContextualFragment so its scripts run. Its CSS
 * then styles the whole page and page CSS applies to it.
 *
 * Authored cells, in model order: [0] snippet (rich text, code block), [1] renderInline,
 * then one row per "Snippet Image" item (a picked image each).
 */
import { createOptimizedPicture } from '../../scripts/aem.js';
import { DAM_ASSET_HOST } from '../../scripts/config.js';

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

// The snippet field is rich text; authors paste the HTML into a code block. It's
// stored and delivered escaped inside <pre>/<code>, which is the only form that
// survives publishing intact (real markup, e.g. from a plain textarea, is
// reduced to paragraphs and links on the way to Edge Delivery). Rebuild the
// code block's text (decoded, line breaks kept); escaped text in paragraphs or
// over line breaks works the same way. Real markup (any element besides the
// text wrappers above) is used as is.
export function readSnippet(block) {
  const cell = block.querySelector(':scope > div > div') || block;
  // A code block is the authoring model, so it always wins: on author the field
  // is wrapped in editor elements that would otherwise read as "real markup".
  const codeBlocks = [...cell.querySelectorAll('pre')];
  if (codeBlocks.length) return codeBlocks.map((pre) => pre.textContent).join('\n').trim();
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

// Edge Delivery media image on this site (e.g. ./media_<hash>.jpg copied from a
// published page). createOptimizedPicture keeps only the URL path, so it's
// applied to these alone: an absolute URL on another host (Dynamic Media, a
// CDN) would lose its host. /content/dam/... paths are pointed at the public
// DAM host instead (resolveDamPaths).
const MEDIA_IMAGE = /\/media_[0-9a-f]+\.(?:jpe?g|png|gif|webp|avif)$/i;
export function isMediaImage(src) {
  try {
    const url = new URL(src, window.location.href);
    return url.origin === window.location.origin && MEDIA_IMAGE.test(url.pathname);
  } catch (e) {
    return false;
  }
}

// Replace media images (plain <img> or inside <picture>) with an optimized
// <picture> (webp + fallback, 750px), keeping the author's other attributes
// (class, id, style, width, height…). The snippet is only re-serialized when it
// has such an image, so any other snippet is passed through untouched.
const MEDIA_HINT = /\bmedia_[0-9a-f]+\./i;
export function optimizeImages(html) {
  if (!MEDIA_HINT.test(html)) return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  let changed = false;
  tpl.content.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!isMediaImage(src)) return;
    // Eager: see LAZY below.
    const picture = createOptimizedPicture(src, img.getAttribute('alt') || '', true, [{ width: '750' }]);
    const optimized = picture.querySelector('img');
    [...img.attributes]
      .filter(({ name }) => !['src', 'srcset', 'sizes', 'alt', 'loading'].includes(name))
      .forEach(({ name, value }) => optimized.setAttribute(name, value));
    (img.closest('picture') || img).replaceWith(picture);
    changed = true;
  });
  return changed ? tpl.innerHTML : html;
}

// Relative DAM references (/content/dam/...) don't load on Edge Delivery, so
// point them at the host that serves DAM files (DAM_ASSET_HOST in config.js):
// src / srcset (every candidate) / poster / data-src / href (e.g. PDFs) and CSS
// url(...). Absolute URLs and other paths are untouched; on author (no host
// configured) nothing changes.
const DAM_REF = /((?:\b(?:src|srcset|poster|data-src|href)\s*=\s*["']?)|(?:url\(\s*["']?)|(?:,\s*))\/content\/dam\//gi;
export function resolveDamPaths(html, host = DAM_ASSET_HOST) {
  if (!host) return html;
  return html.replace(DAM_REF, (m, prefix) => `${prefix}${host.replace(/\/$/, '')}/content/dam/`);
}

// Lazy images never load inside the frame: it starts at 0 height and only
// grows to fit loaded content, so they're never "in view". Load them eagerly
// (the frame itself is part of the page and loads with it).
const LAZY = /\bloading\s*=\s*(["']?)lazy\1/gi;
export function eagerImages(html) {
  return html.replace(LAZY, 'loading="eager"');
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

// Rows after the snippet: the "Render inline (no frame)" flag, then any
// "Snippet Image" items (one picked image each).
const isImageRow = (row) => !!row.querySelector('img');

export function readRenderInline(block) {
  const row = block.children[1];
  return !!row && !isImageRow(row) && /^(true|yes|on)$/i.test(row.textContent.trim());
}

// Picked Snippet Images, in order. Published, they're Edge Delivery media
// images (./media_<hash>.jpg?...); on author, their DAM paths.
export function readSnippetImages(block) {
  return [...block.children].slice(1).filter(isImageRow)
    .map((row) => row.querySelector('img').getAttribute('src'));
}

// Swap the snippet's /content/dam images for the picked Snippet Images, in
// order of first appearance (the same DAM image used twice maps to the same
// pick). The picked image is published, so optimizeImages() then serves it as
// an optimized media picture. Images without a pick are left for the public
// DAM host fallback.
const DAM_IMAGE = /^(?:https?:\/\/[^/]+)?\/content\/dam\//i;
export function useSnippetImages(html, picked) {
  if (!picked.length || !/\/content\/dam\//i.test(html)) return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const order = [];
  tpl.content.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!DAM_IMAGE.test(src)) return;
    if (!order.includes(src)) order.push(src);
    const pick = picked[order.indexOf(src)];
    if (!pick) return;
    img.setAttribute('src', pick);
    img.removeAttribute('srcset');
    img.closest('picture')?.querySelectorAll('source').forEach((s) => s.remove());
  });
  return tpl.innerHTML;
}

// Inline: add the snippet straight into the page. createContextualFragment
// (not innerHTML) so pasted <script> tags run when inserted; each gets the page
// nonce so the site's Content Security Policy allows it.
function renderInline(block, html) {
  const wrap = document.createElement('div');
  wrap.className = 'html-embed-inline';
  wrap.append(document.createRange().createContextualFragment(addNonce(html, pageNonce())));
  block.replaceChildren(wrap);
}

export default function decorate(block) {
  const snippet = readSnippet(block);
  const inline = readRenderInline(block);

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

  const html = resolveDamPaths(optimizeImages(useSnippetImages(snippet, readSnippetImages(block))));
  if (inline) {
    renderInline(block, html);
    return;
  }

  const cs = getComputedStyle(block);
  const fontLinks = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')]
    .map((l) => l.href);

  const frame = document.createElement('iframe');
  frame.className = 'html-embed-frame';
  frame.title = 'Embedded content';
  frame.addEventListener('load', () => autoSize(frame));
  frame.srcdoc = buildDocument(eagerImages(html), {
    font: {
      family: cs.fontFamily, size: cs.fontSize, lineHeight: cs.lineHeight, color: cs.color,
    },
    nonce: pageNonce(),
    fontLinks,
  });
  block.replaceChildren(frame);
}
