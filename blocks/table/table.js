// Table — renders a bordered, horizontally-scrollable data table.
//
// WHY a dedicated block: data tables authored in a plain section rich-text node
// are destroyed by the delivery pipeline (the section markdown/GFM round-trip
// can't represent headerless or multi-paragraph-cell tables — rows are dropped).
// Block-cell content is delivered verbatim, so the table lives in its own block.
//
// The block has a single richtext field with the RTE "Insert Table" button
// enabled (see the `table` filter in _table.json), so authors get the native
// table editor: insert a table, add/remove rows and columns, and type directly
// in cells. On delivery the block cell contains a real <table>; this decorator
// just re-homes it into a scroll wrapper and applies the block styling.
//
// Fallback: if no <table> is present (e.g. content delivered as the plain EDS
// div-grid), rebuild one from the rows/cells so the block still renders.

function buildFromGrid(block) {
  const rows = [...block.children];
  if (!rows.length) return null;
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  table.append(tbody);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const td = document.createElement('td');
      while (cell.firstChild) td.append(cell.firstChild);
      tr.append(td);
    });
    tbody.append(tr);
  });
  return table;
}

export default function decorate(block) {
  // Primary: a real <table> delivered inside the richtext block cell.
  let table = block.querySelector('table');
  // Fallback: rebuild from the EDS div-grid if no table element is present.
  if (!table) table = buildFromGrid(block);
  if (!table) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper';
  wrapper.append(table);

  block.replaceChildren(wrapper);
}
