import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALIGNMENTS = ['align-left', 'align-center', 'align-right'];

// Cell order matches the model: title (richtext), titleType, alignment.
export default function decorate(block) {
  const [titleRow, typeRow, alignRow] = [...block.children];

  const type = HEADINGS.includes(typeRow?.textContent.trim())
    ? typeRow.textContent.trim()
    : 'h2';
  const alignment = ALIGNMENTS.includes(alignRow?.textContent.trim())
    ? alignRow.textContent.trim()
    : 'align-center';

  // Build the heading from the authored richtext, reusing an authored heading's
  // inner markup when present so links/emphasis are preserved.
  const heading = document.createElement(type);
  const authoredHeading = titleRow?.querySelector('h1, h2, h3, h4, h5, h6');
  heading.innerHTML = (authoredHeading || titleRow)?.innerHTML ?? '';
  heading.classList.add('title-block-heading', alignment);

  if (titleRow) moveInstrumentation(titleRow, heading);

  block.replaceChildren(heading);
}
