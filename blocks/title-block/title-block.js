import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALIGNMENTS = ['align-left', 'align-center', 'align-right'];

// Read the plain text of a block cell (first inner div, else the row itself).
function cellText(row) {
  return (row?.textContent || '').trim().toLowerCase();
}

// The block delivers one row per model field (title, titleType, alignment).
// Rather than rely on a fixed cell order (which can vary in delivered markup),
// detect the type and alignment rows by their value pattern, and treat whatever
// remains — the row that actually carries heading/text markup — as the title.
export default function decorate(block) {
  const rows = [...block.children];

  const typeRow = rows.find((r) => HEADINGS.includes(cellText(r)));
  const alignRow = rows.find((r) => ALIGNMENTS.includes(cellText(r)));
  const titleRow = rows.find((r) => r !== typeRow && r !== alignRow)
    || rows.find((r) => r.querySelector('h1, h2, h3, h4, h5, h6'));

  const type = typeRow ? cellText(typeRow) : 'h2';
  const alignment = alignRow ? cellText(alignRow) : 'align-center';

  // Build the heading from the authored richtext, reusing an authored heading's
  // inner markup when present so links/emphasis are preserved.
  const heading = document.createElement(type);
  const authoredHeading = titleRow?.querySelector('h1, h2, h3, h4, h5, h6');
  heading.innerHTML = (authoredHeading || titleRow)?.innerHTML ?? '';
  heading.classList.add('title-block-heading', alignment);

  if (titleRow) moveInstrumentation(titleRow, heading);

  block.replaceChildren(heading);
}
