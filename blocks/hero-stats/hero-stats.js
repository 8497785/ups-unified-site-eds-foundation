import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { createButton } from '../button/button.js';

// The CTA reuses the Button block's cmp-button styles; EDS only auto-loads a
// block's own CSS, so load button.css here (idempotent).
loadCSS(`${window.hlx.codeBasePath}/blocks/button/button.css`);

// A paragraph that only holds one link is the CTA.
function ctaLink(el) {
  if (el.tagName !== 'P') return null;
  const links = el.querySelectorAll('a');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim()
    ? links[0] : null;
}

// Rows: image (+ alt) | text. The text is authored as heading + label pairs
// (e.g. <h4>~460K</h4><p>Employees</p>) followed by an optional link; it is
// rebuilt as a list of stats and a primary Button-block CTA.
export default function decorate(block) {
  const rows = [...block.children];
  const textRow = rows.find((r) => r.querySelector('h1, h2, h3, h4, h5, h6')) || rows[rows.length - 1];
  const imageRow = rows.find((r) => r !== textRow);
  imageRow?.classList.add('hero-stats-media');
  if (!textRow) return;
  textRow.classList.add('hero-stats-content');

  const cell = textRow.firstElementChild || textRow;
  const list = document.createElement('ul');
  list.className = 'hero-stats-list';
  let item;
  let cta;
  [...cell.children].forEach((el) => {
    const link = ctaLink(el);
    if (link) {
      cta = link;
      return;
    }
    const isValue = /^H[1-6]$/.test(el.tagName);
    if (isValue || !item) {
      item = document.createElement('li');
      item.className = 'hero-stats-item';
      list.append(item);
    }
    el.classList.add(isValue ? 'hero-stats-value' : 'hero-stats-label');
    item.append(el);
  });

  const children = [list];
  if (cta) {
    const button = createButton({
      label: cta.textContent.trim(),
      href: cta.getAttribute('href'),
      style: 'primary',
    });
    moveInstrumentation(cta, button);
    const wrap = document.createElement('div');
    wrap.className = 'hero-stats-cta';
    wrap.append(button);
    children.push(wrap);
  }
  cell.classList.add('hero-stats-card');
  cell.replaceChildren(...children);
}
