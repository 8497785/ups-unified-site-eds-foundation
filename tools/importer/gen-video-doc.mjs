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
const h3 = (txt) => new Paragraph({ text: txt, heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 } });
const t = (text, o = {}) => new TextRun({ text, ...o });
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

const recipes = [
  ['YouTube video, plays on scroll', 'Paste the YouTube URL in Video Source. Leave the placeholder off.'],
  ['YouTube with a custom poster', 'Paste the URL, enable Placeholder Image, pick an image and add alt text.'],
  ['DAM / Dynamic Media video', 'Pick the asset in Video Source (opens at /content/dam/upsstories).'],
  ['DAM video with poster', 'Pick the asset, enable Placeholder Image, pick an image and alt text.'],
];

const table = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: [cell('Goal', { header: true, width: 38 }), cell('Steps', { header: true, width: 62 })] }),
    ...recipes.map(([g, s]) => new TableRow({ children: [cell(g, { width: 38 }), cell(s, { width: 62 })] })),
  ],
});

const doc = new Document({
  creator: 'UPS EDS',
  title: 'Video Block — Authoring Guide',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
      heading1: { run: { font: 'Calibri', size: 40, bold: true, color: BROWN } },
      heading2: { run: { font: 'Calibri', size: 30, bold: true, color: BROWN } },
      heading3: { run: { font: 'Calibri', size: 24, bold: true, color: '242424' } },
    },
  },
  numbering: {
    config: [{
      reference: 'steps',
      levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
    }],
  },
  sections: [{
    children: [
      h1('Video Block — Authoring Guide'),
      p('The Video block plays a single video from either YouTube or the AEM DAM / Dynamic Media, with an optional poster (placeholder) image and play button.'),

      h2('Adding the block'),
      step('Open the page in the Universal Editor.'),
      step([t('In the section where you want the video, click the '), t('+', { bold: true }), t(' (Insert) control and choose '), t('Video', { bold: true }), t('.')]),
      step([t('Select the newly added Video block to open its '), t('properties', { bold: true }), t(' panel.')]),
      p([t('Before you set a source, the block shows a neutral '), t('grey placeholder box', { bold: true }), t(' so you can see where the video will sit.')]),

      h2('Fields'),
      h3('1. Video Source (required)'),
      p('This single field accepts either source — the block auto-detects which one you used:'),
      bullet([t('YouTube', { bold: true }), t(' — paste the full URL, e.g. https://www.youtube.com/watch?v=XXXX or https://youtu.be/XXXX')]),
      bullet([t('DAM / Dynamic Media video', { bold: true }), t(' — click the picker and select a video asset. The picker opens at /content/dam/upsstories.')]),
      bullet('A DAM video published to Dynamic Media plays through the Scene7 video viewer.', 1),
      bullet('A plain video file plays in a standard HTML5 player.', 1),

      h3('2. Enable Placeholder Image (optional, off by default)'),
      p('A checkbox. When you turn it on, two more fields appear:'),
      bullet([t('Placeholder Image', { bold: true }), t(' — pick a poster image from the DAM. The video shows this image with a play button overlaid, and only loads when the visitor clicks it (better for page performance).')]),
      bullet([t('Placeholder Alt Text', { bold: true }), t(' — accessible alt text describing the poster image.')]),
      p([t('When the checkbox is '), t('off', { bold: true }), t(', no poster is shown and the video loads on its own — even if you had picked an image earlier, it is ignored.')]),

      h2('Behavior notes'),
      bullet([t('With a placeholder image: ', { bold: true }), t('the visitor sees the poster + play button; clicking it loads and plays the video.')]),
      bullet([t('Without a placeholder image: ', { bold: true }), t('the video loads automatically when it scrolls into view.')]),
      bullet('The play button matches the Dynamic Media viewer style (a large semi-transparent dark circle with a white triangle).'),

      h2('Where it renders'),
      bullet('The Dynamic Media (Scene7) viewer appears on the published page (and in the Universal Editor author view) — not in the plain local preview.'),
      bullet('YouTube and standard video files render everywhere.'),

      h2('Quick recipes'),
      table,
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
await writeFile(process.argv[2], buf);
console.log('wrote', process.argv[2], buf.length, 'bytes');
