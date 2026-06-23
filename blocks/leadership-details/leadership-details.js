import { createOptimizedPicture } from '../../scripts/aem.js';

function toMasterJsonUrl(fragmentPath) {
  const clean = fragmentPath.replace(/\/$/, '').replace(/\.html$/, '');
  return `${clean}/jcr:content/data/master.json`;
}

async function fetchFragment(fragmentPath) {
  try {
    const resp = await fetch(toMasterJsonUrl(fragmentPath));
    if (resp.ok) return resp.json();
  } catch (e) {
    // network/auth/CORS failure — fall through to null
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const fragmentPath = link
    ? link.getAttribute('href')
    : block.textContent.trim();

  if (!fragmentPath) {
    block.replaceChildren();
    return;
  }

  const data = await fetchFragment(fragmentPath);
  if (!data) {
    // Runtime fetch unavailable (e.g. unauthenticated context); render nothing.
    block.replaceChildren();
    return;
  }

  const content = document.createElement('div');
  content.className = 'leadership-bio-content';

  const displayName = data.title
    || [data.firstName, data.lastName].filter(Boolean).join(' ');
  if (displayName) {
    const h1 = document.createElement('h1');
    h1.textContent = displayName;
    content.append(h1);
  }

  if (data.subtitle) {
    const role = document.createElement('p');
    role.className = 'leadership-bio-title';
    role.textContent = data.subtitle;
    content.append(role);
  }

  if (data.bio) {
    const bio = document.createElement('div');
    bio.className = 'leadership-bio-body';
    bio.innerHTML = data.bio;
    content.append(bio);
  }

  const media = document.createElement('div');
  media.className = 'leadership-bio-media';
  if (data.headshot) {
    const pic = createOptimizedPicture(data.headshot, displayName, true, [{ width: '750' }]);
    media.append(pic);
  }

  block.replaceChildren(content, media);
}
