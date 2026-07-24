import { moveInstrumentation } from '../../scripts/scripts.js';

const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ALIGNMENTS = ['align-left', 'align-center', 'align-right'];
const BOOLEANS = ['true', 'false', 'yes', 'no', 'on', 'off'];

// Plain text of a block cell.
function cellText(row) {
  return (row?.textContent || '').trim();
}

// The block delivers one row per model field. In delivered markup the titleType
// select collapses into the heading tag of the title cell (e.g. <h3>Text</h3>),
// so there may be no separate "h3" text row. Detect what we can:
//  - alignment row: the cell whose text is align-left/center/right
//  - eyebrow row: the cell whose text is a boolean (showEyebrow)
//  - title row: the remaining cell (its heading tag gives the level)
//  - a standalone type row (plain "h3") is also honored if present.
export default function decorate(block) {
  const rows = [...block.children];

  const alignRow = rows.find((r) => ALIGNMENTS.includes(cellText(r).toLowerCase()));
  const eyebrowRow = rows.find((r) => r !== alignRow
    && BOOLEANS.includes(cellText(r).toLowerCase()));
  const typeRow = rows.find((r) => r !== alignRow && r !== eyebrowRow
    && HEADINGS.includes(cellText(r).toLowerCase()));
  const titleRow = rows.find((r) => r !== alignRow && r !== eyebrowRow && r !== typeRow);

  const authoredHeading = titleRow?.querySelector('h1, h2, h3, h4, h5, h6');
  const type = (typeRow && cellText(typeRow).toLowerCase())
    || authoredHeading?.tagName.toLowerCase()
    || 'h2';
  const alignment = alignRow ? cellText(alignRow).toLowerCase() : 'align-center';
  const showEyebrow = /^(true|yes|on)$/i.test(cellText(eyebrowRow));

  const heading = document.createElement(type);
  heading.textContent = cellText(authoredHeading || titleRow);
  heading.classList.add('title-heading', alignment);

  if (titleRow) moveInstrumentation(titleRow, heading);

  const children = [heading];
  if (showEyebrow) {
    const eyebrow = document.createElement('div');
    eyebrow.className = `title-eyebrow ${alignment}`;
    children.push(eyebrow);
  }

  block.replaceChildren(...children);
}
