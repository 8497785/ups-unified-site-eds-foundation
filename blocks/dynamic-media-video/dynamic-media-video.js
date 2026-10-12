/*
 * Dynamic Media Video block — plays a video picked with the Universal Editor
 * Custom Content Advisor (configurable asset picker) through Dynamic Media
 * with OpenAPI. Independent of the Video block (which handles YouTube and
 * Scene7 classic videos).
 *
 * Authored cells, in model order:
 *   [0] video        — the picker's delivery URL,
 *                      https://<delivery-host>/adobe/assets/urn:aaid:aem:<id>[/…]
 *   [1] playerLabel  — accessible name for the player
 *
 * The asset id is taken from the URL and played with Adobe's embeddable
 * player (/adobe/assets/<id>/play), which handles adaptive streaming.
 */

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

const ASSET_ID = /^(.*?\/assets\/urn:aaid:aem:[0-9a-f-]+)/i;

// Delivery URL from the picker (any rendition / seo-name suffix) -> player URL.
// Returns '' when the value isn't a Dynamic Media with OpenAPI asset URL.
export function toPlayerUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  let url;
  try {
    url = new URL(raw, window.location.href);
  } catch (e) {
    return '';
  }
  const m = ASSET_ID.exec(url.pathname);
  return m ? `${url.origin}${m[1]}/play` : '';
}

// The picker value may arrive as a link or as plain text.
function cellValue(row) {
  if (!row) return '';
  const a = row.querySelector('a[href]');
  return a ? a.getAttribute('href') : row.textContent.trim();
}

function notice(block, text) {
  const p = document.createElement('p');
  p.className = 'dynamic-media-video-notice';
  p.textContent = text;
  block.replaceChildren(p);
}

export default function decorate(block) {
  const [videoRow, labelRow] = [...block.children];
  const value = cellValue(videoRow);
  const label = labelRow ? labelRow.textContent.trim() : '';
  const src = toPlayerUrl(value);

  if (!src) {
    if (isAuthorEnvironment()) {
      notice(block, value
        ? 'This video can\'t be played: pick it again with the asset picker (Dynamic Media with OpenAPI).'
        : 'Pick a video in the Video field to show it here.');
    } else {
      block.replaceChildren();
    }
    return;
  }

  const frame = document.createElement('div');
  frame.className = 'dynamic-media-video-frame';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = label || 'Video';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
  iframe.setAttribute('allowfullscreen', '');
  frame.append(iframe);
  block.replaceChildren(frame);
}
