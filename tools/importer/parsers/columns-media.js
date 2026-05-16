/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media
 * Base block: columns
 * Source selector: div.upspr-xd-card.left
 * Two-column layout: left column image, right column category tag + heading + description + CTA
 * Source URL: https://about.ups.com/us/en/home.html
 * Generated: 2026-05-16
 *
 * xwalk project - Columns blocks do NOT require field hint comments per hinting rules.
 *
 * Validated selectors against source HTML:
 *   .col-lg-6:first-child picture       -> <picture> wrapping the left-column image
 *   a.upspr-eyebrow-link                -> category tag link ("OUR IMPACT")
 *   .upspr-xd-card_eyebrow              -> category tag text inside the link
 *   .upspr-xd-card_content h2           -> main heading
 *   .upspr-xd-card_content p            -> description paragraph
 *   a.btn.btn-secondary                 -> CTA button link ("See Our Impact")
 */
export default function parse(element, { document }) {
  // === LEFT COLUMN: Image ===
  const picture = element.querySelector('.col-lg-6:first-child picture');
  const img = element.querySelector('.col-lg-6:first-child img.upspr-xd-card_image, .col-lg-6:first-child img');

  const leftCell = [];
  if (picture) {
    leftCell.push(picture);
  } else if (img) {
    leftCell.push(img);
  }

  // === RIGHT COLUMN: Category tag, heading, description, CTA ===
  const rightCell = [];

  // Category tag (eyebrow) - build a clean link with just text and href
  const eyebrowLink = element.querySelector('a.upspr-eyebrow-link');
  const eyebrowDiv = element.querySelector('.upspr-xd-card_eyebrow');
  if (eyebrowLink) {
    const cleanLink = document.createElement('a');
    cleanLink.href = eyebrowLink.href || eyebrowLink.getAttribute('href') || '';
    cleanLink.textContent = eyebrowDiv
      ? eyebrowDiv.textContent.trim()
      : eyebrowLink.textContent.trim();
    const eyebrowPara = document.createElement('p');
    eyebrowPara.appendChild(cleanLink);
    rightCell.push(eyebrowPara);
  } else if (eyebrowDiv) {
    const eyebrowPara = document.createElement('p');
    eyebrowPara.textContent = eyebrowDiv.textContent.trim();
    rightCell.push(eyebrowPara);
  }

  // Heading
  const heading = element.querySelector('.upspr-xd-card_content h2, .upspr-xd-card_container h2, h2');
  if (heading) {
    rightCell.push(heading);
  }

  // Description paragraph
  const description = element.querySelector('.upspr-xd-card_content p, .upspr-xd-card_container p, p');
  if (description) {
    rightCell.push(description);
  }

  // CTA button link - build clean link without icon children
  const cta = element.querySelector('a.btn.btn-secondary, .upspr-xd-card_content a.btn, a.btn');
  if (cta) {
    const cleanCta = document.createElement('a');
    cleanCta.href = cta.href || cta.getAttribute('href') || '';
    // Extract only direct text, excluding nested icon elements
    let ctaText = '';
    cta.childNodes.forEach((node) => {
      if (node.nodeType === 3) { // Text node
        ctaText += node.textContent;
      }
    });
    cleanCta.textContent = ctaText.trim() || cta.textContent.trim();
    const ctaPara = document.createElement('p');
    ctaPara.appendChild(cleanCta);
    rightCell.push(ctaPara);
  }

  // === Build cells: 1 row, 2 columns matching library example ===
  // Library example: | image | category tag, heading, description, CTA |
  const cells = [
    [leftCell, rightCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
