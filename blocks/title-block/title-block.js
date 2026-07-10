import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALIGNMENTS = ['align-left', 'align-center', 'align-right'];

// Plain text of a block cell.
function cellText(row) {
  return (row?.textContent || '').trim();
}

// The block delivers one row per model field (title, titleType, alignment).
// Detect the type and alignment rows by their value; the remaining row is the
// plain-text title. Render it inside the chosen heading with the align class.
export default function decorate(block) {
  const rows = [...block.children];

  const typeRow = rows.find((r) => HEADINGS.includes(cellText(r).toLowerCase()));
  const alignRow = rows.find((r) => ALIGNMENTS.includes(cellText(r).toLowerCase()));
  const titleRow = rows.find((r) => r !== typeRow && r !== alignRow);

  const type = typeRow ? cellText(typeRow).toLowerCase() : 'h2';
  const alignment = alignRow ? cellText(alignRow).toLowerCase() : 'align-center';

  const heading = document.createElement(type);
  heading.textContent = cellText(titleRow);
  heading.classList.add('title-block-heading', alignment);

  if (titleRow) moveInstrumentation(titleRow, heading);

  block.replaceChildren(heading);
}
