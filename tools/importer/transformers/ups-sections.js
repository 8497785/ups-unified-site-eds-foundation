/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: UPS About site section breaks.
 * Inserts <hr> section dividers and Section Metadata blocks based on
 * payload.template.sections from page-templates.json.
 * Runs only in afterTransform after cleanup has removed non-authorable content.
 *
 * Section selectors verified against migration-work/cleaned.html from about.ups.com:
 *   1. Tagline:             div.headline:has(h1)
 *   2. Featured Story Hero: div.hero:has(.upspr-heroimage:not(.vertical-hero))
 *   3. Story Cards:         div.pr04-threecolumnteaser
 *   4. About Us Text Band:  div.headline:has(h4:first-child)
 *   5. Stats / Facts:       div.hero:has(.upspr-heroimage.vertical-hero)
 *   6. Impact Media Card:   div.sectioncard
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || !Array.isArray(sections) || sections.length < 2) {
      return;
    }

    const document = element.ownerDocument;

    // Process sections in reverse order so DOM insertions do not shift
    // the position of elements that have not been processed yet.
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (!section || !section.selector) {
        continue;
      }

      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) {
        continue;
      }

      // Add Section Metadata block when the section has a style defined
      if (section.style) {
        const sectionMetadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        // Insert Section Metadata after the section element
        if (sectionEl.nextSibling) {
          sectionEl.parentNode.insertBefore(sectionMetadata, sectionEl.nextSibling);
        } else {
          sectionEl.parentNode.appendChild(sectionMetadata);
        }
      }

      // Insert <hr> before each non-first section to create section breaks
      if (i > 0) {
        const hr = document.createElement('hr');
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }
}
