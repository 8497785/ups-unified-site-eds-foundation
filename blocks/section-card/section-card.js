// Section Card — the source site's "Section card" (.sectioncard /
// .upspr-xd-card): an image half and a content half with an eyebrow link, a
// heading, a description and a CTA button. Image left by default; the
// image-right block class (Image Position: Right) swaps the sides at desktop.
//
// Authored cells, in model order (xwalk field collapse merges each group into
// one cell): image (+ imageAlt) | eyebrow link (+ eyebrowText) | title (+
// titleType -> heading tag) | text | cta (+ ctaText, ctaType -> <strong>/<em>).
// Rows are found by content, so an empty optional field doesn't shift the
// others. The existing cells are moved, not rebuilt, to keep Universal Editor
// instrumentation; only the CTA link is swapped for a Button-block button.

import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { createButton } from '../button/button.js';

// The CTA reuses the Button block's cmp-button styles; EDS only auto-loads a
// block's own CSS, so load button.css here (idempotent).
loadCSS(`${window.hlx.codeBasePath}/blocks/button/button.css`);

const cellOf = (row) => row?.firstElementChild || row;

export default function decorate(block) {
  const rows = [...block.children];
  const imageRow = rows.find((r) => r.querySelector('picture'));
  const headingRow = rows.find((r) => r !== imageRow && r.querySelector('h1, h2, h3, h4, h5, h6'));
  const headingIndex = headingRow ? rows.indexOf(headingRow) : -1;

  // Before the heading: the eyebrow. After it: the description, then the CTA
  // (the last row holding a single link, wrapped in <strong>/<em> or alone).
  const rest = rows.filter((r) => r !== imageRow && r !== headingRow);
  const eyebrowRow = rest.find((r) => headingIndex === -1 || rows.indexOf(r) < headingIndex);
  const after = rest.filter((r) => r !== eyebrowRow);
  const isCta = (r) => {
    const links = r.querySelectorAll('a');
    return links.length === 1 && r.textContent.trim() === links[0].textContent.trim();
  };
  const ctaRow = [...after].reverse().find(isCta);
  const textRow = after.find((r) => r !== ctaRow && r.textContent.trim());

  const media = document.createElement('div');
  media.className = 'section-card-media';
  if (imageRow) media.append(...cellOf(imageRow).childNodes);

  const content = document.createElement('div');
  content.className = 'section-card-content';

  const eyebrowLink = eyebrowRow?.querySelector('a');
  if (eyebrowLink) {
    eyebrowLink.className = 'section-card-eyebrow';
    eyebrowLink.closest('.button-container')?.classList.remove('button-container');
    const p = document.createElement('p');
    p.className = 'section-card-eyebrow-wrap';
    moveInstrumentation(cellOf(eyebrowRow), p);
    p.append(eyebrowLink);
    content.append(p);
  }

  const heading = headingRow?.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('section-card-heading');
    content.append(heading);
  }

  if (textRow) {
    const text = cellOf(textRow);
    text.classList.add('section-card-text');
    content.append(text);
  }

  const ctaLink = ctaRow?.querySelector('a');
  if (ctaLink) {
    const primary = !!ctaLink.closest('strong') || ctaLink.classList.contains('primary');
    const button = createButton({
      label: ctaLink.textContent.trim(),
      href: ctaLink.getAttribute('href'),
      style: primary ? 'primary' : 'secondary',
    });
    moveInstrumentation(ctaLink, button);
    const wrap = document.createElement('div');
    wrap.className = 'section-card-cta';
    moveInstrumentation(cellOf(ctaRow), wrap);
    wrap.append(button);
    content.append(wrap);
  }

  block.replaceChildren(media, content);
}
