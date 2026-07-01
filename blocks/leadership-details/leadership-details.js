/* eslint-disable no-underscore-dangle */
import { createOptimizedPicture } from '../../scripts/aem.js';

const DEFAULT_PROJECT = 'ups-global';
const DEFAULT_QUERY = 'leadership-details';

/**
 * Normalize a Content Fragment path: drop the .html suffix the aem-content
 * picker appends and any trailing slash.
 */
function normalizeCfPath(path) {
  return (path || '').replace(/\.html$/, '').replace(/\/$/, '');
}

/**
 * Build the AEM GraphQL persisted-query URL with a raw (unencoded) semicolon
 * param — the persisted query parses the literal path, so encoding the
 * slashes/colons would break it. Same-origin (author tier).
 */
function buildQueryUrl(project, queryName, cfPath) {
  return `/graphql/execute.json/${project}/${queryName};path=${cfPath}`;
}

async function fetchLeader(url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      return json?.data?.leaderships?.list || null;
    }
  } catch (e) {
    // network/auth/CORS failure — fall through to null
  }
  return null;
}

// Read a row's link href, falling back to its trimmed text (aem-content).
function readPath(row) {
  if (!row) return '';
  const a = row.querySelector('a');
  return (a ? a.getAttribute('href') : row.textContent.trim()) || '';
}

export default async function decorate(block) {
  // Fields in model order: fragment, buttons, highRes, lowRes.
  const rows = [...block.children];
  const fragmentRow = rows[0];
  const buttonsRow = rows[1];

  // "buttons" multiselect: which affordances to show. Empty = show both.
  const buttonsText = buttonsRow ? buttonsRow.textContent.trim().toLowerCase() : '';
  const showPrint = !buttonsText || buttonsText.includes('print');
  const showDownload = !buttonsText || buttonsText.includes('download');

  // Optional custom download image paths; fall back to the headshot later.
  const customHighRes = normalizeCfPath(readPath(rows[2]));
  const customLowRes = normalizeCfPath(readPath(rows[3]));

  const cfPath = normalizeCfPath(readPath(fragmentRow) || block.textContent.trim());

  if (!cfPath) {
    block.replaceChildren();
    return;
  }

  const data = await fetchLeader(buildQueryUrl(DEFAULT_PROJECT, DEFAULT_QUERY, cfPath));
  if (!data) {
    // Runtime fetch unavailable (e.g. off-AEM origin or unauthenticated); render nothing.
    block.replaceChildren();
    return;
  }

  const displayName = [data.firstName, data.lastName].filter(Boolean).join(' ');

  // Left column: name, subtitle, bio.
  const content = document.createElement('div');
  content.className = 'leadership-bio-content';

  if (displayName) {
    const h1 = document.createElement('h1');
    h1.className = 'leadership-bio-name';
    h1.textContent = displayName;
    content.append(h1);
  }

  if (data.subtitle) {
    const role = document.createElement('p');
    role.className = 'leadership-bio-title';
    role.textContent = data.subtitle;
    content.append(role);
  }

  const details = data.bio && data.bio.details;
  if (details) {
    const bio = document.createElement('div');
    bio.className = 'leadership-bio-body';
    bio.innerHTML = details;
    content.append(bio);
  }

  // Right column: portrait + print affordance (top-right).
  const media = document.createElement('div');
  media.className = 'leadership-bio-media';

  if (showPrint) {
    const print = document.createElement('div');
    print.className = 'upspr-print upspr-bio-print';
    const printLink = document.createElement('a');
    printLink.href = '#';
    printLink.className = 'onclick-print';
    printLink.setAttribute('role', 'button');
    printLink.setAttribute('aria-label', `Print profile ${displayName}`);
    printLink.innerHTML = '<i class="upspr upspr-icon-print"></i>';
    printLink.addEventListener('click', (e) => { e.preventDefault(); window.print(); });
    print.append(printLink);
    media.append(print);
  }

  const headshot = data.headshot && data.headshot._path;
  if (headshot) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'upspr-bio-image';
    const pic = createOptimizedPicture(headshot, displayName, true, [{ width: '750' }]);
    imageWrap.append(pic);

    if (showDownload) {
      // Download trigger button
      const dlBtn = document.createElement('div');
      dlBtn.className = 'upspr-bio-image_download-btn upspr-image_download-btn';
      dlBtn.innerHTML = '<button type="button"><i class="upspr upspr-icon-download"></i>'
        + '<span class="upspr-readerTxt">Open Download Image Section</span></button>';

      // Download overlay (High Res / Low Res). Use author-provided paths when
      // set, otherwise default both to the headshot image.
      const highResUrl = customHighRes || headshot;
      const lowResUrl = customLowRes || headshot;
      const overlay = document.createElement('div');
      overlay.className = 'upspr-bio-image-overlay upspr-image-overlay';
      overlay.innerHTML = `
        <i class="upspr upspr-icon-x" role="button" tabindex="0" aria-label="close"></i>
        <div class="upspr-bio-download">
          <div class="upspr-eyebrow-head"><span class="upspr-eyebrow-text">DOWNLOAD</span></div>
          <ul>
            <li><a href="${highResUrl}" download class="upspr-story-download" aria-label="download High Res image">
              <div class="upspr-icon-container"><i class="upspr upspr-icon-dot"></i><i class="upspr upspr-icon-download"></i></div>
              <span class="upspr-download-label" aria-hidden="true">High Res</span>
            </a></li>
            <li><a href="${lowResUrl}" download class="upspr-story-download" aria-label="download Low Res image">
              <div class="upspr-icon-container"><i class="upspr upspr-icon-dot"></i><i class="upspr upspr-icon-download"></i></div>
              <span class="upspr-download-label" aria-hidden="true">Low Res</span>
            </a></li>
          </ul>
        </div>`;

      dlBtn.querySelector('button').addEventListener('click', () => {
        overlay.style.display = 'block';
      });
      overlay.querySelector('.upspr-icon-x').addEventListener('click', () => {
        overlay.style.display = 'none';
      });

      imageWrap.append(dlBtn, overlay);
    }

    media.append(imageWrap);
  }

  block.replaceChildren(content, media);
}
