import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const row = block.firstElementChild;
  const wrap = document.createElement('div');
  wrap.className = 'headline-wrap';

  if (row) {
    moveInstrumentation(row, wrap);
    // Promote authored text to an h1 if it isn't already a heading.
    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      const h1 = document.createElement('h1');
      h1.innerHTML = heading.innerHTML;
      wrap.append(h1);
    } else {
      const h1 = document.createElement('h1');
      h1.innerHTML = row.innerHTML;
      wrap.append(h1);
    }
  }

  block.replaceChildren(wrap);
}
