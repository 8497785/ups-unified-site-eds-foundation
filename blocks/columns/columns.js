// Parse a `layout-N-N...` class into an array of 12-grid widths, e.g.
// `layout-3-3-6` -> [3, 3, 6]. Returns null when no layout class is present.
function readLayout(block) {
  const cls = [...block.classList].find((c) => /^layout-\d+(-\d+)*$/.test(c));
  return cls ? cls.replace('layout-', '').split('-').map(Number) : null;
}

// Apply Bootstrap-style col-lg-* spans to each column cell based on the layout
// preset. When the preset length doesn't match the actual column count (author
// changed the count without updating the layout), fall back to an equal split.
function applyLayout(block, layout) {
  const row = block.firstElementChild;
  const cols = [...row.children];
  const n = cols.length || 1;
  let widths = layout;
  if (!widths || widths.length !== n) {
    const base = Math.floor(12 / n);
    widths = new Array(n).fill(base);
    widths[n - 1] += 12 - base * n;
  }
  cols.forEach((col, i) => col.classList.add(`col-lg-${widths[i]}`));
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Layout preset (from a `layout-*` class) drives per-column widths on a
  // 12-unit grid; styled in columns.css.
  const layout = readLayout(block);
  if (layout) applyLayout(block, layout);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
