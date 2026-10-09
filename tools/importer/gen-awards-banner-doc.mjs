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
  ['Three awards on a brown band', 'Add a section, Styles: Highlight (UPS Brown). Add Awards Banner, add 3 Awards, fill Eyebrow + Title.'],
  ['Award with no eyebrow', 'Add an Award, leave Eyebrow Text blank, fill only Title Text.'],
  ['More than three awards', 'Keep clicking + ; extras wrap to a new row of three on desktop.'],
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
  title: 'Awards Banner — Authoring Guide',
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
      h1('Awards Banner — Authoring Guide'),
      p([t('Renamed from '), t('Three Column Teaser', { bold: true }), t('. Blocks added before the rename keep working and show as "Awards Banner" in the editor; they do not need re-authoring.', { italics: true })]),
      p('The Awards Banner shows a row of short award highlights — each an Eyebrow Text (small uppercase label with a gold accent line) above a Title Text. It is a repeatable block: add as many awards as you need, and they lay out three across on desktop.'),

      h2('Adding the block'),
      step('Open the page in the Universal Editor.'),
      step([t('In the section where you want the awards, click the '), t('+', { bold: true }), t(' (Insert) control and choose '), t('Awards Banner', { bold: true }), t('.')]),
      step([t('Select the block, then click '), t('+', { bold: true }), t(' to add an '), t('Award', { bold: true }), t('.')]),

      h2('Fields (per Award)'),
      p('Each Award is one group of two fields:'),
      bullet([t('Eyebrow Text', { bold: true }), t(' — a short label shown in small uppercase with a gold accent line to its left (e.g. "SINCE 2022"). Optional — leave it blank and only the title shows.')]),
      bullet([t('Title Text', { bold: true }), t(' — the award headline, shown as a larger heading below the eyebrow.')]),

      h2('Adding more awards'),
      p('Click + on the Awards Banner block to add another Award, and fill its Eyebrow Text + Title Text. Repeat for each award. You can reorder or delete individual awards from the content tree.'),

      h2('Layout'),
      bullet([t('Desktop (>= 992px): ', { bold: true }), t('three awards across in a row.')]),
      bullet([t('Tablet and mobile (< 992px): ', { bold: true }), t('awards stack to a single full-width column.')]),
      bullet('Adding more than three awards wraps to additional rows of three on desktop.'),

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
