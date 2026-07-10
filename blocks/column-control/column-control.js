import { decorateBlock, loadBlock, toClassName } from '../../scripts/aem.js';

const GRID_UNITS = 12;

// Read the layout preset from the container's `layout-*` class (set via the
// block's Layout dropdown). Returns an array of column widths, e.g.
// `layout-8-4` -> [8, 4]. Falls back to null when absent.
function readLayout(block) {
  const cls = [...block.classList].find((c) => /^layout-\d+(-\d+)*$/.test(c));
  return cls ? cls.replace('layout-', '').split('-').map(Number) : null;
}

// Distribute 12 units equally across n columns (remainder into the last).
function equalWidths(n) {
  const base = Math.floor(GRID_UNITS / n);
  const widths = new Array(n).fill(base);
  widths[n - 1] += GRID_UNITS - base * n;
  return widths;
}

// Resolve final per-column widths for the given column count.
// Prefer the authored layout preset; if its length doesn't match the number of
// columns (author added/removed a column), fall back to an equal split.
function resolveWidths(layout, columnCount) {
  const n = columnCount || 1;
  if (layout && layout.length === n) {
    const total = layout.reduce((sum, w) => sum + w, 0);
    if (total !== GRID_UNITS) {
      // eslint-disable-next-line no-console
      console.warn(`Total column width must equal 12. Current total: ${total}`);
      return equalWidths(n);
    }
    return layout;
  }
  return equalWidths(n);
}

// Convert a nested block authored as a raw <table> (delivered inside a column —
// the EDS pipeline only converts top-level block tables) into standard block
// DOM: <div class="<name> block"> rows/cells </div>.
function tableToBlock(table) {
  const headerText = table.querySelector('thead th, thead td')?.textContent.trim() || '';
  if (!headerText) return;
  const name = toClassName(headerText);
  const wrapper = document.createElement('div');
  wrapper.className = `${name} block`;
  wrapper.dataset.blockName = name;
  table.querySelectorAll('tbody tr').forEach((tr) => {
    const rowDiv = document.createElement('div');
    [...tr.children].forEach((td) => {
      const cellDiv = document.createElement('div');
      cellDiv.append(...td.childNodes);
      rowDiv.append(cellDiv);
    });
    wrapper.append(rowDiv);
  });
  table.replaceWith(wrapper);
}

// Decorate + load any blocks authored inside the columns (EDS only auto-decorates
// top-level section blocks), handling raw <table> markup too. Each nested block
// is wrapped in its own <div> so the EDS-added `<name>-wrapper` class lands on
// that wrapper, not on the `.grid-column` cell.
async function loadNestedBlocks(columns) {
  columns.forEach((col) => {
    col.querySelectorAll(':scope table').forEach((table) => tableToBlock(table));
  });
  // Find nested block divs anywhere inside a column (not just direct children):
  // the EDS pipeline can wrap a nested block in a <p>/<div>, so a `:scope > div`
  // selector would miss it. A block is a div whose first class is a known block
  // name and that hasn't been decorated yet.
  const nested = columns.flatMap((col) => [
    ...col.querySelectorAll('div[class]:not([data-block-status])'),
  ].filter((el) => el.classList.length && !el.classList.contains('grid-column')));
  await Promise.all(nested.map(async (el) => {
    const wrapper = document.createElement('div');
    el.replaceWith(wrapper);
    wrapper.append(el);
    decorateBlock(el);
    await loadBlock(el);
  }));
}

export default function decorate(block) {
  // A columns container delivers its cells inside a single intermediate row div.
  const rows = [...block.children];
  let row;
  let columns;
  if (rows.length === 1 && rows[0].children.length > 1) {
    [row] = rows;
    columns = [...row.children];
  } else {
    row = block;
    columns = rows;
  }

  row.classList.add('row');

  const layout = readLayout(block);
  const widths = resolveWidths(layout, columns.length);
  columns.forEach((col, i) => {
    col.classList.add('grid-column', `col-lg-${widths[i]}`);
  });

  loadNestedBlocks(columns);
}
