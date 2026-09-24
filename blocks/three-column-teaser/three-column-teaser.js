/*
 * Three Column Teaser block.
 * Container of repeatable "Teaser Column" items; authors click + to add another
 * column. Each item delivers a row with two cells in model order:
 *   [0] Eyebrow Text
 *   [1] Title Text
 * Rendered as a responsive grid of teaser columns (3 across on desktop).
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('teaser-column');
    const [eyebrowCell, titleCell] = [...row.children];
    if (eyebrowCell) {
      eyebrowCell.className = 'teaser-column-eyebrow';
      // drop an empty eyebrow cell so it doesn't reserve space
      if (!eyebrowCell.textContent.trim()) eyebrowCell.remove();
    }
    if (titleCell) titleCell.className = 'teaser-column-title';
  });
}
