/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-story
 * Base block: cards
 * Source selector: div.upspr-three-column-teaser
 * Generated: 2026-05-16
 *
 * Validation note: UPS.com returns HTTP 403 to headless Playwright (Akamai WAF).
 * All selectors verified against the live DOM via interactive Playwright session:
 *   - 3 cards found matching .upspr-stories-list__item
 *   - Each card confirmed with image, eyebrow link, h3 heading, and description
 *
 * Extracts a 3-column grid of story cards. Each card has:
 *   - Image (with alt text)
 *   - Category tag link (eyebrow)
 *   - H3 heading (linked)
 *   - Description text
 *
 * Target table (from block library): each card = 1 row, 2 columns (image | text).
 * UE model (xwalk container block): card item fields:
 *   - image (reference) -> Column 1
 *   - text (richtext)   -> Column 2: category tag + heading + description
 */
export default function parse(element, { document }) {
  // Select all card containers
  const cardItems = element.querySelectorAll('.upspr-stories-list__item');

  const cells = [];

  cardItems.forEach((card) => {
    // --- Column 1: Image with field hint ---
    const img = card.querySelector('.upspr-content-tile__image img, img.upspr-tile-image');

    const imageCell = document.createDocumentFragment();
    if (img) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // --- Column 2: Text (category tag + heading + description) with field hint ---
    const textCell = document.createDocumentFragment();
    let hasTextContent = false;

    // Category tag (eyebrow link)
    const eyebrowLink = card.querySelector('a.upspr-eyebrow-link');
    if (eyebrowLink) {
      const cleanLink = document.createElement('a');
      cleanLink.href = eyebrowLink.href || eyebrowLink.getAttribute('href');
      cleanLink.textContent = (card.querySelector('.upspr-eyebrow-text') || eyebrowLink).textContent.trim();
      const tagP = document.createElement('p');
      tagP.appendChild(cleanLink);
      textCell.appendChild(document.createComment(' field:text '));
      textCell.appendChild(tagP);
      hasTextContent = true;
    }

    // Heading (h3) wrapped in card link
    const heading = card.querySelector('h3');
    if (heading) {
      const headingLink = card.querySelector('.upspr-content-tile__details a.upspr-content-tile__link');
      const h3 = document.createElement('h3');
      if (headingLink) {
        const a = document.createElement('a');
        a.href = headingLink.href || headingLink.getAttribute('href');
        a.textContent = heading.textContent.trim();
        h3.appendChild(a);
      } else {
        h3.textContent = heading.textContent.trim();
      }
      if (!hasTextContent) {
        textCell.appendChild(document.createComment(' field:text '));
        hasTextContent = true;
      }
      textCell.appendChild(h3);
    }

    // Description
    const description = card.querySelector('.upspr-description, span.upspr-description');
    if (description) {
      const descP = document.createElement('p');
      descP.textContent = description.textContent.trim();
      if (!hasTextContent) {
        textCell.appendChild(document.createComment(' field:text '));
        hasTextContent = true;
      }
      textCell.appendChild(descP);
    }

    // Push row: [imageCell, textCell]
    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-story', cells });
  element.replaceWith(block);
}
