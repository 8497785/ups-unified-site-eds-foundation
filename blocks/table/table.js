// Table — renders a bordered, horizontally-scrollable data table.
//
// WHY a dedicated block: data tables authored in a plain section rich-text node
// are destroyed by the delivery pipeline (the section markdown/GFM round-trip
// can't represent headerless or multi-paragraph-cell tables — rows are dropped).
// Block-cell content, by contrast, is delivered verbatim. So a table lives in
// its own block; this decorator normalizes whatever DOM the block receives into
// one clean semantic <table> and wraps it for horizontal scroll on small
// screens.
//
// It accepts two delivered shapes:
//  1. A verbatim <table> already inside the block (preserved from a block cell)
//     — reused as-is (just re-homed + styled).
//  2. The standard EDS block grid (<div> rows / <div> cells) — rebuilt into a
//     <table>; the first row becomes <thead> only when every cell is a heading
//     (<strong>/<b>/<th>), otherwise the table is all <tbody> (matches the
//     source press-release tables, which have no header row).

function buildFromGrid(block) {
  const table = document.createElement('table');
  const rows = [...block.children];
  if (!rows.length) return null;

  // Treat the first row as a header only when every non-empty cell is bold
  // (<strong>/<b>/<th>). The source press-release tables have no such row, so
  // they render as all-<tbody> (matching the original).
  const firstCells = [...rows[0].children];
  const firstIsHeader = firstCells.length > 0 && firstCells.every((cell) => {
    const t = cell.textContent.trim();
    return t !== '' && cell.querySelector('strong, b, th') !== null;
  });

  const thead = firstIsHeader ? document.createElement('thead') : null;
  const tbody = document.createElement('tbody');
  if (thead) table.append(thead);
  table.append(tbody);

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const isHeaderRow = thead && i === 0;
    [...row.children].forEach((cell) => {
      const el = document.createElement(isHeaderRow ? 'th' : 'td');
      if (isHeaderRow) el.scope = 'col';
      // Move the cell's content across (preserves inline markup + paragraphs).
      while (cell.firstChild) el.append(cell.firstChild);
      tr.append(el);
    });
    (isHeaderRow ? thead : tbody).append(tr);
  });
  return table;
}

export default function decorate(block) {
  // Case 1: a verbatim <table> survived inside the block cell — reuse it.
  let table = block.querySelector('table');

  // Case 2: no table element — rebuild one from the block's div grid.
  if (!table) table = buildFromGrid(block);
  if (!table) return;

  // Wrap for horizontal scroll so wide financial tables don't overflow.
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.append(table);

  block.replaceChildren(wrapper);
}
