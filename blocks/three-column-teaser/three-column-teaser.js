/*
 * Legacy alias for the Awards Banner block (renamed from "Three Column Teaser").
 * Blocks authored before the rename are still saved as "Three Column Teaser",
 * so they deliver this class. Hand them to the Awards Banner code and styles
 * so they keep working without re-authoring. Not offered in the Add menu.
 */
import decorateAwardsBanner from '../awards-banner/awards-banner.js';

export default function decorate(block) {
  block.classList.add('awards-banner');
  return decorateAwardsBanner(block);
}
