/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-featured
 * Base block: hero
 * Source: https://about.ups.com/us/en/home.html
 * Selector: div.upspr-heroimage:not(.vertical-hero)
 * Generated: 2026-05-16
 *
 * Extracts a full-width background image with overlaid content card
 * containing category tag link, heading, description, and CTA button.
 *
 * UE Model fields:
 *   - image (reference) — background image (imageAlt collapsed)
 *   - text (richtext) — category tag + heading + description + CTA
 *
 * Validated selectors against source HTML:
 *   picture                                  -> <picture> with responsive sources and img
 *   a.upspr-eyebrow-link                    -> category tag link ("CUSTOMER FIRST")
 *   .upspr-eyebrow-text                     -> eyebrow text span
 *   h4.upspr-heroimage_msg--title           -> main heading
 *   .upspr-heroimage_msg > p               -> description paragraph
 *   .upspr-read-the-story a.btn            -> CTA button link ("Read more")
 *
 * Target table (from block library):
 *   | hero-featured |
 *   |---|
 *   | <!-- field:image --> <picture> ... </picture> |
 *   | <!-- field:text --> <p><a>tag</a></p><h4>heading</h4><p>desc</p><p><a>CTA</a></p> |
 */
export default function parse(element, { document }) {
  // --- Row 1: Background image (field: image) ---
  const picture = element.querySelector('picture');

  const imgFrag = document.createDocumentFragment();
  imgFrag.appendChild(document.createComment(' field:image '));
  if (picture) {
    imgFrag.appendChild(picture);
  }

  // --- Row 2: Rich text content (field: text) ---
  const textFrag = document.createDocumentFragment();

  // Category tag (eyebrow link)
  const eyebrowLink = element.querySelector('a.upspr-eyebrow-link');
  if (eyebrowLink) {
    const cleanLink = document.createElement('a');
    cleanLink.href = eyebrowLink.href;
    const eyebrowText = element.querySelector('.upspr-eyebrow-text');
    cleanLink.textContent = eyebrowText
      ? eyebrowText.textContent.trim()
      : eyebrowLink.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(cleanLink);
    textFrag.appendChild(p);
  }

  // Heading
  const heading = element.querySelector('h4.upspr-heroimage_msg--title, h3.upspr-heroimage_msg--title, h2.upspr-heroimage_msg--title');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    textFrag.appendChild(h);
  }

  // Description paragraph
  const description = element.querySelector('.upspr-heroimage_msg > p');
  if (description) {
    const p = document.createElement('p');
    p.textContent = description.textContent.trim();
    textFrag.appendChild(p);
  }

  // CTA button link
  const ctaLink = element.querySelector('.upspr-read-the-story a.btn, .upspr-read-the-story a');
  if (ctaLink) {
    const cleanCta = document.createElement('a');
    cleanCta.href = ctaLink.href;
    // Extract only direct text nodes, excluding nested screen-reader spans and icons
    let ctaText = '';
    ctaLink.childNodes.forEach((node) => {
      if (node.nodeType === 3) { // Text node
        ctaText += node.textContent;
      }
    });
    cleanCta.textContent = ctaText.trim() || ctaLink.textContent.trim();
    const p = document.createElement('p');
    p.appendChild(cleanCta);
    textFrag.appendChild(p);
  }

  // Wrap text content with field hint
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  textCell.appendChild(textFrag);

  // Build cells matching block library: Row 1 = image, Row 2 = text
  const cells = [];
  cells.push([imgFrag]);
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-featured', cells });
  element.replaceWith(block);
}
