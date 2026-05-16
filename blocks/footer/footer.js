import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function getLocalePrefix() {
  const { pathname } = window.location;
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})\//);
  return match ? `/${match[1]}/${match[2]}` : '';
}

async function loadFooterFragment(footerMeta) {
  if (footerMeta) return loadFragment(new URL(footerMeta, window.location).pathname);
  const prefix = getLocalePrefix();
  if (prefix) {
    const localized = await loadFragment(`${prefix}/footer`);
    if (localized) return localized;
  }
  return loadFragment('/footer');
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const fragment = await loadFooterFragment(footerMeta);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
