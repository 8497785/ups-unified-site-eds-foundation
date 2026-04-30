import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const picture = block.querySelector('picture');
  const lastRow = rows[rows.length - 1];
  const links = lastRow.querySelectorAll('a');
  const headings = lastRow.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const paragraphs = lastRow.querySelectorAll('p');

  block.textContent = '';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'media-card-image';
  if (picture) {
    imageDiv.append(picture);
  }

  const content = document.createElement('div');
  content.className = 'media-card-content';

  if (links.length > 1) {
    const categoryLink = links[0];
    const category = document.createElement('a');
    category.className = 'media-card-category';
    category.href = categoryLink.href;
    category.textContent = categoryLink.textContent;
    content.append(category);
  }

  if (headings.length > 0) {
    const heading = document.createElement('h2');
    heading.className = 'media-card-heading';
    heading.textContent = headings[0].textContent;
    moveInstrumentation(headings[0], heading);
    content.append(heading);
  }

  const descParagraphs = [...paragraphs].filter((p) => !p.querySelector('a') && !p.querySelector('picture') && p.textContent.trim());
  if (descParagraphs.length > 0) {
    const desc = document.createElement('p');
    desc.className = 'media-card-description';
    desc.textContent = descParagraphs[0].textContent;
    content.append(desc);
  }

  const ctaLink = links.length > 0 ? links[links.length - 1] : null;
  if (ctaLink) {
    const cta = document.createElement('a');
    cta.className = 'media-card-cta';
    cta.href = ctaLink.href;
    cta.textContent = ctaLink.textContent.replace(/\s+/g, ' ').trim();
    content.append(cta);
  }

  block.append(imageDiv);
  block.append(content);
}
