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

export default async function decorate(block) {
  const link = block.querySelector('a');
  const rawPath = link ? link.getAttribute('href') : block.textContent.trim();
  const cfPath = normalizeCfPath(rawPath);

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

  const print = document.createElement('button');
  print.type = 'button';
  print.className = 'leadership-bio-print';
  print.setAttribute('aria-label', `Print profile ${displayName}`);
  print.innerHTML = '<span class="upspr upspr-icon-print" aria-hidden="true"></span>';
  print.addEventListener('click', () => window.print());
  media.append(print);

  const headshot = data.headshot && data.headshot._path;
  if (headshot) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'leadership-bio-image';
    const pic = createOptimizedPicture(headshot, displayName, true, [{ width: '750' }]);
    imageWrap.append(pic);
    media.append(imageWrap);
  }

  block.replaceChildren(content, media);
}
