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
      const eyebrowText = eyebrowCell.textContent.trim();
      if (!eyebrowText) {
        // drop an empty eyebrow cell so it doesn't reserve space
        eyebrowCell.remove();
      } else {
        // Match the source markup:
        // <div class="upspr-eyebrow-head"><span class="upspr-eyebrow-text">…</span></div>
        eyebrowCell.className = 'upspr-eyebrow-head teaser-column-eyebrow';
        const span = document.createElement('span');
        span.className = 'upspr-eyebrow-text';
        span.textContent = eyebrowText;
        eyebrowCell.replaceChildren(span);
      }
    }
    if (titleCell) {
      // Render the title as an <h3> (matches the source teaser markup). Unwrap a
      // single <p> so the text sits directly in the h3 (as on the source) and
      // isn't affected by section paragraph margins.
      const h3 = document.createElement('h3');
      h3.className = 'teaser-column-title';
      const soleP = titleCell.children.length === 1 && titleCell.querySelector(':scope > p');
      h3.innerHTML = soleP ? soleP.innerHTML : titleCell.innerHTML;
      titleCell.replaceWith(h3);
    }
  });
}
