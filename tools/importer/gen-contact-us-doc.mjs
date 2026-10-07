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
const b = (text) => t(text, { bold: true });
const p = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], spacing: { after: 120 } });
const bullet = (runs, level = 0) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], bullet: { level }, spacing: { after: 60 } });
const step = (runs) => new Paragraph({ children: Array.isArray(runs) ? runs : [new TextRun(runs)], numbering: { reference: 'steps', level: 0 }, spacing: { after: 60 } });

function cell(text, { header = false, width } = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, color: header ? 'FFFFFF' : undefined })] })],
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: header ? { fill: BROWN } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function table(headers, widths, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) })),
    ],
  });
}

const fields = [
  ['Title', 'Heading across the top of the card, e.g. "Media Resources".'],
  ['Left card', 'Rich text for the left part: a heading, paragraphs and a contact list.'],
  ['Right card', 'Rich text for the right part, e.g. "Additional Information" with links.'],
  ['Presentation', 'Full width stretches the card across the whole content width. Leave it off for the default: a centred card, 10 of 12 columns wide.'],
];

const icons = [
  ['Phone number, e.g. tel:1-404-828-7123', 'Phone'],
  ['Email address, e.g. mailto:pr@ups.com', 'Mail'],
  ['X / Twitter page, e.g. https://x.com/ups_news or https://twitter.com/ups_news', 'X logo'],
];

const troubleshooting = [
  ['A contact item has no icon', 'The item must contain a link to a tel: number, a mailto: address or an x.com / twitter.com page.'],
  ['A part is missing on the published page', 'It is empty — add content to Left card or Right card.'],
  ['A link looks like a button', 'Links inside this block always show as plain links; if you see a button, the content is probably in a different block.'],
];

const recipes = [
  ['Media Resources card (as on Negotiations)', 'Title "Media Resources". Left card: heading "For Reporters and Media Outlets", two paragraphs, a list with the phone, email and "Follow @UPS_News…" links. Right card: heading "Additional Information" and a "Media library" link.'],
  ['Card across the whole width', 'Presentation: Full width.'],
  ['Single-part card', 'Fill in Left card only and leave Right card empty.'],
];

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Contact Us — Authoring Guide',
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
      h1('Contact Us — Authoring Guide'),
      p('The Contact Us block shows a white card with a title across the top and two parts side by side: a left card (e.g. "For Reporters and Media Outlets" with phone, email and X contacts) and a right card (e.g. "Additional Information" with links). It is used for the "Media Resources" section on the Negotiations page.'),

      h2('Adding the block'),
      step('Open the page in the Universal Editor.'),
      step([t('In the section where you want the card, click the '), b('+'), t(' (Insert) control and choose '), b('Contact Us'), t('.')]),
      step('Select the block and fill in its fields in the properties panel, or click into the title and the two cards on the page to edit them directly.'),

      h2('Fields'),
      table(['Field', 'Description'], [24, 76], fields),

      h2('Writing the cards'),
      bullet([b('Headings'), t(' — use a heading (e.g. Heading 4) for each part\'s label. It is shown in small grey capitals, e.g. "FOR REPORTERS AND MEDIA OUTLETS".')]),
      bullet([b('Text'), t(' — normal paragraphs.')]),
      bullet([b('Links'), t(' — shown bold, underlined and blue. A link on its own line (e.g. "Media library") stays a plain link; it does not turn into a button.')]),

      h2('Contact list icons'),
      p('In a bulleted list, each item that contains one of these links gets its icon automatically — you don\'t add icons yourself:'),
      table(['Link in the list item', 'Icon'], [70, 30], icons),
      p([t('To create these links, select the text (e.g. "1-404-828-7123"), add a link and enter the tel: or mailto: address, or the X profile URL. Extra text around the link is fine — e.g. "'), b('Follow'), t(' @UPS_News '), b('for the latest company news'), t('".')]),
      p('List items without such a link are shown as a plain list: no bullets in the left card, grey bullets in the right card.'),

      h2('Layout'),
      bullet([b('Desktop (>= 992px): '), t('the left card takes about 7/12 of the width and the right card 5/12, with a light grey vertical line between them.')]),
      bullet([b('Tablet and mobile (< 992px): '), t('the two parts stack, with a light grey line between them, and the card padding is smaller.')]),
      bullet([b('Full width: '), t('same layout, but the card spans the whole content width.')]),

      h2('Empty parts'),
      p([t('If you leave '), b('Left card'), t(' or '), b('Right card'), t(' empty, that part is left out on the published page and the other part spans the card (no divider). In the editor the empty part stays visible so you can still click into it and add content.')]),

      h2('Troubleshooting'),
      table(['Problem', 'What to do'], [34, 66], troubleshooting),

      h2('Quick recipes'),
      table(['Goal', 'Steps'], [34, 66], recipes),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
