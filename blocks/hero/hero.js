import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const [imageRow, textRow] = rows;

  if (imageRow) {
    const picture = imageRow.querySelector('picture');
    if (picture) {
      moveInstrumentation(imageRow, picture);
      block.prepend(picture);
      imageRow.remove();
    }
  }

  if (textRow) {
    const content = document.createElement('div');
    content.className = 'hero-content';
    moveInstrumentation(textRow, content);
    content.innerHTML = textRow.innerHTML;
    block.append(content);
    textRow.remove();
  }
}
