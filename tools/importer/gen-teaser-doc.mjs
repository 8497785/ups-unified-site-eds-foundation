/* eslint-disable */
import { writeFile } from 'fs/promises';
const require = (await import('module')).createRequire(import.meta.url);
const DOCX = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules/docx';
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
} = require(DOCX);

const BROWN = '351C15';
const h1 = (txt) => new Paragraph({ text: txt, heading: HeadingLevel.HEADING_1, spacing: { after: 160 } });
const h2 = (txt) => new Paragraph({ text: txt, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
const t = (text, o = {}) => new TextRun({ text, ...o });
const p = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], spacing: { after: 120 } });
const bullet = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], bullet: { level: 0 }, spacing: { after: 60 } });
const step = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], numbering: { reference: 'steps', level: 0 }, spacing: { after: 60 } });

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? 'FFFFFF' : undefined })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header ? { fill: BROWN } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

const recipes = [
  ['Three teasers on a brown band', 'Add a section, Styles: Highlight (UPS Brown). Add Three Column Teaser, add 3 Teaser Columns, fill Eyebrow + Title.'],
  ['Teaser with no eyebrow', 'Add a Teaser Column, leave Eyebrow Text blank, fill only Title Text.'],
  ['More than three teasers', 'Keep clicking + ; extras wrap to a new row of three on desktop.'],
];

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: [cell('Goal', { header: true, width: 34 }), cell('Steps', { header: true, width: 66 })] }),
    ...recipes.map(([g, s]) => new TableRow({ children: [cell(g, { width: 34 }), cell(s, { width: 66 })] })),
  ],
});

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Three Column Teaser — Authoring Guide',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
      heading1: { run: { font: 'Calibri', size: 40, bold: true, color: BROWN } },
      heading2: { run: { font: 'Calibri', size: 30, bold: true, color: BROWN } },
    },
  },
  numbering: {
    config: [{ reference: 'steps', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }] }],
  },
  sections: [{
    children: [
      h1('Three Column Teaser — Authoring Guide'),
      p('The Three Column Teaser shows a row of short teasers — each an Eyebrow Text (small uppercase label with a gold accent line) above a Title Text. It is a repeatable block: add as many teaser columns as you need, and they lay out three across on desktop.'),

      h2('Adding the block'),
      step('Open the page in the Universal Editor.'),
      step([t('In the section where you want the teasers, click the '), t('+', { bold: true }), t(' (Insert) control and choose '), t('Three Column Teaser', { bold: true }), t('.')]),
      step([t('Select the block, then click '), t('+', { bold: true }), t(' to add a '), t('Teaser Column', { bold: true }), t('.')]),

      h2('Fields (per Teaser Column)'),
      p('Each Teaser Column is one group of two fields:'),
      bullet([t('Eyebrow Text', { bold: true }), t(' — a short label shown in small uppercase with a gold accent line to its left (e.g. "SINCE 2022"). Optional — leave it blank and only the title shows.')]),
      bullet([t('Title Text', { bold: true }), t(' — the teaser headline, shown as a larger heading below the eyebrow.')]),

      h2('Adding more columns'),
      p('Click + on the Three Column Teaser block to add another Teaser Column, and fill its Eyebrow Text + Title Text. Repeat for each teaser. You can reorder or delete individual columns from the content tree.'),

      h2('Layout'),
      bullet([t('Desktop (>= 992px): ', { bold: true }), t('three teasers across in a row.')]),
      bullet([t('Tablet and mobile (< 992px): ', { bold: true }), t('teasers stack to a single full-width column.')]),
      bullet('Adding more than three columns wraps to additional rows of three on desktop.'),

      h2('Using it on a UPS Brown section'),
      p([t('Place the block in a section and set '), t('Spacing & Style → Highlight (UPS Brown)', { bold: true }), t(' to get the dark brown band. On that background the eyebrow and title text render white for contrast, while the eyebrow accent line stays gold.')]),

      h2('Quick recipes'),
      table,
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
