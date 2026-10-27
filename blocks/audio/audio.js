/*
 * Audio block — a native audio player for an audio file picked with the
 * Universal Editor Custom Content Advisor (asset picker limited to audio, see
 * tools/assets-selector/audio.config.json).
 *
 * Authored cells, in model order:
 *   [0] text       — optional rich text above the player ("Listen to this article")
 *   [1] audio      — the picker's value: a Dynamic Media with OpenAPI delivery URL
 *                    (https://<delivery-host>/adobe/assets/urn:aaid:aem:<id>[/…]),
 *                    or a DAM path (/content/dam/…, e.g. migrated content)
 *   [2] audioLabel — optional accessible name for the player
 */

import { DAM_ASSET_HOST } from '../../scripts/config.js';

function isAuthorEnvironment() {
  return window.location.hostname.endsWith('.adobeaemcloud.com');
}

const ASSET_ID = /^(.*?\/assets\/urn:aaid:aem:[0-9a-f-]+)(\/.*)?$/i;

// Picker value -> playable audio URL.
//  - Dynamic Media with OpenAPI asset URL: its original file,
//    /adobe/assets/<id>/original/as/<file name>
//  - DAM path: served from the AEM publish host on Edge Delivery (DAM paths
//    aren't served by Edge Delivery), relative on author.
// Returns '' when the value can't be played.
export function toAudioUrl(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/content/dam/')) return `${DAM_ASSET_HOST}${raw}`;
  let url;
  try {
    url = new URL(raw, window.location.href);
  } catch (e) {
    return '';
  }
  const m = ASSET_ID.exec(url.pathname);
  if (!m) return /^https?:$/.test(url.protocol) && /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac)$/i.test(url.pathname) ? url.href : '';
  if (/^\/original\/as\//.test(m[2] || '')) return `${url.origin}${m[1]}${m[2]}`;
  const name = url.searchParams.get('assetname')
    || (m[2] || '').split('/').filter(Boolean).pop()
    || 'audio.mp3';
  return `${url.origin}${m[1]}/original/as/${encodeURIComponent(name)}`;
}

// The picker value may arrive as a link or as plain text.
function cellValue(row) {
  if (!row) return '';
  const a = row.querySelector('a[href]');
  return a ? a.getAttribute('href') : row.textContent.trim();
}

function notice(text) {
  const p = document.createElement('p');
  p.className = 'audio-notice';
  p.textContent = text;
  return p;
}

export default function decorate(block) {
  const [textRow, audioRow, labelRow] = [...block.children];
  const textCell = textRow?.firstElementChild;
  const value = cellValue(audioRow);
  const label = labelRow ? labelRow.textContent.trim() : '';
  const src = toAudioUrl(value);

  const children = [];
  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'audio-text';
    text.append(...textCell.childNodes);
    children.push(text);
  }

  if (src) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.setAttribute('controlslist', 'nodownload');
    audio.src = src;
    const name = label || (children[0] ? children[0].textContent.trim() : '');
    if (name) audio.setAttribute('aria-label', name);
    audio.textContent = 'Your browser does not support the audio element.';
    children.push(audio);
  } else if (isAuthorEnvironment()) {
    children.push(notice(value
      ? 'This audio can\'t be played: pick it again with the asset picker.'
      : 'Pick an audio file in the Audio field to show the player here.'));
  } else {
    // Nothing to play on a published page: render nothing (not just the text).
    block.replaceChildren();
    return;
  }

  block.replaceChildren(...children);
}
