import { decorateBlock, loadBlock, toClassName } from '../../scripts/aem.js';

const GRID_UNITS = 12;

// Read an explicit width (1-12) from a column's `width-N` class, or null for Auto.
function readColumnWidth(col) {
  const cls = [...col.classList].find((c) => /^width-\d+$/.test(c));
  return cls ? Number(cls.replace('width-', '')) : null;
}

// Optional container-level width pattern, e.g. `cols-8-4`. Per-column `width-N`
// classes are the primary (spec) source; this token is a fallback used when the
// per-column classes can't travel (e.g. through the content importer), so the
// same layout renders in preview and in the authored JCR.
function readContainerPattern(block) {
  const cls = [...block.classList].find((c) => /^cols-\d+(-\d+)*$/.test(c));
  return cls ? cls.replace('cols-', '').split('-').map(Number) : null;
}

// Resolve every column to a 1-12 span.
// - All Auto  -> equal split across the row.
// - Explicit  -> used as-is.
// - Mixed     -> explicit kept; remaining units split across the Auto columns.
// - Invalid   -> normalize to equal split and warn.
function resolveWidths(columns) {
  const explicit = columns.map(readColumnWidth);
  const autoCount = explicit.filter((w) => w === null).length;
  const n = columns.length || 1;

  if (autoCount === n) {
    const base = Math.floor(GRID_UNITS / n);
    const widths = new Array(n).fill(base);
    widths[n - 1] += GRID_UNITS - base * n; // absorb remainder into last col
    return widths;
  }

  const explicitTotal = explicit.reduce((sum, w) => sum + (w || 0), 0);

  if (autoCount === 0) {
    if (explicitTotal !== GRID_UNITS) {
      // eslint-disable-next-line no-console
      console.warn(`Total column width must equal 12. Current total: ${explicitTotal}`);
      const base = Math.floor(GRID_UNITS / n);
      const widths = new Array(n).fill(base);
      widths[n - 1] += GRID_UNITS - base * n;
      return widths;
    }
    return explicit;
  }

  // Mixed: distribute the leftover across the Auto columns.
  const remaining = Math.max(GRID_UNITS - explicitTotal, autoCount);
  const perAuto = Math.floor(remaining / autoCount);
  let autoSeen = 0;
  return explicit.map((w) => {
    if (w !== null) return w;
    autoSeen += 1;
    return autoSeen === autoCount ? remaining - perAuto * (autoCount - 1) : perAuto;
  });
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
// that wrapper, not on the `.grid-column`.
async function loadNestedBlocks(columns) {
  columns.forEach((col) => {
    col.querySelectorAll(':scope table').forEach((table) => tableToBlock(table));
  });
  const nested = columns.flatMap((col) => [
    ...col.querySelectorAll(':scope > div[class]:not([data-block-status])'),
  ]);
  await Promise.all(nested.map(async (el) => {
    const wrapper = document.createElement('div');
    el.replaceWith(wrapper);
    wrapper.append(el);
    decorateBlock(el);
    await loadBlock(el);
  }));
}

export default function decorate(block) {
  // The columns container usually delivers its cells inside a single row <div>.
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

  const pattern = readContainerPattern(block);
  const widths = (pattern && pattern.length === columns.length)
    ? pattern
    : resolveWidths(columns);
  columns.forEach((col, i) => {
    col.classList.add('grid-column', `col-lg-${widths[i]}`);
  });

  loadNestedBlocks(columns);
}
