import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  if (window.location.hostname === 'localhost') {
    footerPath = '/content/footer';
  }

  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
