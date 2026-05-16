/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-stats
 * Base block: hero
 * Source: https://about.ups.com/us/en/home.html
 * Selector: div.upspr-heroimage.vertical-hero
 * Generated: 2026-05-16
 *
 * Extracts a full-width background image with an overlaid statistics panel
 * containing stat items (value h4 + label p) and a CTA button.
 *
 * UE Model fields (from _hero-stats.json):
 *   - image (reference) -> Row 1: background picture (imageAlt collapsed)
 *   - text (richtext) -> Row 2: stat items + CTA link
 *
 * Target table (from block library):
 *   | hero-stats |
 *   |---|
 *   | <!-- field:image --> <picture>...</picture> |
 *   | <!-- field:text --> <h4>value</h4><p>label</p>... <a>CTA</a> |
 */
export default function parse(element, { document }) {
  // --- Row 1: Background image (field: image) ---
  // Validated selectors: picture > source, picture > img.upspr-heroimage_img
  const picture = element.querySelector('picture');

  const imageContainer = document.createElement('div');
  imageContainer.appendChild(document.createComment(' field:image '));
  if (picture) {
    imageContainer.appendChild(picture.cloneNode(true));
  }

  // --- Row 2: Stats richtext content (field: text) ---
  // Validated selectors:
  //   ul.upspr-facts > li.upspr-facts__content — stat items
  //   h4.upspr-facts__content--fact — stat value (e.g., "~460K")
  //   p.upspr-facts__content--label — stat label (e.g., "Employees")
  //   .upspr-read-the-story a.btn — CTA link
  const textContainer = document.createElement('div');
  let hasTextContent = false;

  const statItems = element.querySelectorAll('li.upspr-facts__content');

  statItems.forEach((item) => {
    const factEl = item.querySelector('h4.upspr-facts__content--fact, h4');
    const labelEl = item.querySelector('p.upspr-facts__content--label, p');

    if (factEl) {
      if (!hasTextContent) {
        textContainer.appendChild(document.createComment(' field:text '));
        hasTextContent = true;
      }
      const h4 = document.createElement('h4');
      h4.textContent = factEl.textContent.trim();
      textContainer.appendChild(h4);
    }
    if (labelEl) {
      if (!hasTextContent) {
        textContainer.appendChild(document.createComment(' field:text '));
        hasTextContent = true;
      }
      const p = document.createElement('p');
      p.textContent = labelEl.textContent.trim();
      textContainer.appendChild(p);
    }
  });

  // CTA link
  const ctaLink = element.querySelector('.upspr-read-the-story a.btn, .upspr-read-the-story a');
  if (ctaLink) {
    if (!hasTextContent) {
      textContainer.appendChild(document.createComment(' field:text '));
      hasTextContent = true;
    }
    const cleanCta = document.createElement('a');
    cleanCta.href = ctaLink.getAttribute('href') || ctaLink.href;
    // Extract visible text only, skip nested icon spans
    let ctaText = '';
    for (const node of ctaLink.childNodes) {
      if (node.nodeType === 3) { // TEXT_NODE
        const t = node.textContent.trim();
        if (t) { ctaText = t; break; }
      }
    }
    cleanCta.textContent = ctaText || ctaLink.textContent.trim();
    const ctaPara = document.createElement('p');
    ctaPara.appendChild(cleanCta);
    textContainer.appendChild(ctaPara);
  }

  // Build cells: Row 1 = image, Row 2 = text content
  const cells = [
    [imageContainer],
    [textContainer],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-stats', cells });
  element.replaceWith(block);
}
