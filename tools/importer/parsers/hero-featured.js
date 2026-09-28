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
 * Block table rows:
 *   Row 1: block name (+ optional variants)
 *   Row 2: background image (field: image; imageAlt collapses into <img alt>)
 *   Row 3: rich text (field: text) — heading, description
 *   Row 4: eyebrow text (field: topic)
 *   Row 5: CTA (field: ctaLink; ctaLinkText collapses into the link text)
 * The block links the eyebrow to the parent page of ctaLink, so the source
 * eyebrow's own href is not imported.
 * Dynamic eyebrow and layout (full-width / align-left / align-right) are variant
 * classes, not content rows — so they are never emitted here.
 *
 * Validated selectors against source HTML:
 *   picture                                  -> <picture> with responsive sources and img
 *   a.upspr-eyebrow-link                    -> category tag link ("CUSTOMER FIRST")
 *   .upspr-eyebrow-text                     -> eyebrow text span
 *   h4.upspr-heroimage_msg--title           -> main heading
 *   .upspr-heroimage_msg > p               -> description paragraph
 *   .upspr-read-the-story a.btn            -> CTA button link ("Read more")
 *
 * Target table (matches hero-featured block model — 4 content rows):
 *   | hero-featured |
 *   |---|
 *   | <!-- field:image --> <picture> ... </picture> |
 *   | <!-- field:text --> <h4>heading</h4><p>desc</p> |
 *   | <!-- field:topic --> tag |
 *   | <!-- field:ctaLink --> <a href="story page">Read more</a> |
 */
export default function parse(element, { document }) {
  // --- Row 1: Background image (field: image) ---
  const picture = element.querySelector('picture');

  const imgFrag = document.createDocumentFragment();
  imgFrag.appendChild(document.createComment(' field:image '));
  if (picture) {
    imgFrag.appendChild(picture);
  }

  // --- Row 3: Category tag / eyebrow text (field: topic) ---
  const topicFrag = document.createDocumentFragment();
  topicFrag.appendChild(document.createComment(' field:topic '));
  const eyebrowText = element.querySelector('.upspr-eyebrow-text')
    || element.querySelector('a.upspr-eyebrow-link');
  if (eyebrowText && eyebrowText.textContent.trim()) {
    topicFrag.appendChild(document.createTextNode(eyebrowText.textContent.trim()));
  }

  // --- Row 2: Rich text content (field: text) ---
  const textFrag = document.createDocumentFragment();

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

  // --- Row 4: CTA button (field: ctaLink + ctaLinkText) ---
  const ctaFrag = document.createDocumentFragment();
  ctaFrag.appendChild(document.createComment(' field:ctaLink '));
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
    ctaFrag.appendChild(cleanCta);
  }

  // Wrap text content with field hint
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  textCell.appendChild(textFrag);

  // Build cells matching the block model: image, text, topic, CTA
  const cells = [];
  cells.push([imgFrag]);
  cells.push([textCell]);
  cells.push([topicFrag]);
  cells.push([ctaFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-featured', cells });
  element.replaceWith(block);
}
