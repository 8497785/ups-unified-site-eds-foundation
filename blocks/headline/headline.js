import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const row = block.firstElementChild;
  const wrap = document.createElement('div');
  wrap.className = 'headline-wrap';

  if (row) {
    moveInstrumentation(row, wrap);
    // Promote authored text to an h1 if it isn't already a heading.
    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    const h1 = document.createElement('h1');
    h1.innerHTML = (heading || row).innerHTML;
    // Unwrap any strong/b tags — weight comes from the block CSS (500).
    h1.querySelectorAll('strong, b').forEach((el) => {
      el.replaceWith(...el.childNodes);
    });
    wrap.append(h1);
  }

  block.replaceChildren(wrap);
}
