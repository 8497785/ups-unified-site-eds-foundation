import { getMetadata } from '../../scripts/aem.js';

// Hero v1 — single-image "cards" view: a background image with an overlaid
// content card (eyebrow, title, description, CTA).
//
// Authoring model (see _hero-v1.json) keeps the hero 3-row convention:
//   Row 1: image  (imageAlt collapses into <img alt>)
//   Row 2: text   (richtext card: eyebrow link, title, description, CTA)
// Presentation options are variant classes (never content rows):
//   full-width / align-left / align-right  -> layout (see CSS)
//   eyebrow-dynamic                        -> resolve eyebrow from page metadata
//
// Eyebrow behavior:
//   - Static (default): the eyebrow is authored inline as the first link in the
//     text cell — left exactly as authored.
//   - Dynamic (eyebrow-dynamic class): the authored eyebrow (if any) is replaced
//     with the topic/topic-link resolved from the current page's metadata; falls
//     back gracefully to no eyebrow when the metadata is absent.
//
// Legacy content (image + inline-eyebrow text, no variant class) renders exactly
// as before.

// Build an eyebrow element matching the existing `.button-container:first-child
// a.button` styling. A missing link still renders the anchor (non-navigating tag).
function buildEyebrow(text, href) {
  const container = document.createElement('p');
  container.className = 'button-container';
  const a = document.createElement('a');
  a.className = 'button';
  if (href) a.href = href;
  a.textContent = text;
  container.append(a);
  return container;
}

export default function decorate(block) {
  if (!block.classList.contains('eyebrow-dynamic')) return; // static: leave as authored

  const card = block.lastElementChild?.querySelector(':scope > div')
    || block.lastElementChild;
  if (!card) return;

  // Resolve the eyebrow from the current page's metadata.
  const topicText = getMetadata('topic');
  const topicHref = getMetadata('topic-link');

  // Remove any authored inline eyebrow (the first link/button-container) so the
  // dynamic value replaces it rather than duplicating it.
  const authoredEyebrow = card.querySelector(':scope > .button-container:first-child')
    || card.querySelector(':scope > p:first-child');
  if (authoredEyebrow && authoredEyebrow.querySelector('a')) authoredEyebrow.remove();

  // Inject the resolved eyebrow; fall back to no eyebrow when metadata is absent.
  if (topicText) {
    card.prepend(buildEyebrow(topicText, topicHref));
  }
}
