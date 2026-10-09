/*
 * Awards Banner block (formerly "Three Column Teaser").
 * Container of repeatable "Award" items; authors click + to add another
 * award. Each item delivers a row with two cells in model order:
 *   [0] Eyebrow Text
 *   [1] Title Text
 * Rendered as a responsive grid of awards (3 across on desktop).
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('award');
    const [eyebrowCell, titleCell] = [...row.children];
    if (eyebrowCell) {
      const eyebrowText = eyebrowCell.textContent.trim();
      if (!eyebrowText) {
        // drop an empty eyebrow cell so it doesn't reserve space
        eyebrowCell.remove();
      } else {
        // Match the source markup:
        // <div class="upspr-eyebrow-head"><span class="upspr-eyebrow-text">…</span></div>
        eyebrowCell.className = 'upspr-eyebrow-head award-eyebrow';
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
      h3.className = 'award-title';
      const soleP = titleCell.children.length === 1 && titleCell.querySelector(':scope > p');
      h3.innerHTML = soleP ? soleP.innerHTML : titleCell.innerHTML;
      titleCell.replaceWith(h3);
    }
  });
}
