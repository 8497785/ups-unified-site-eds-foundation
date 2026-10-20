// Image — a picture (with alt text) that is optionally clickable.
//
// AEM's built-in Image component doesn't publish extra fields, so Image is a
// block. Its fields are grouped (picture_*) so the image, alt text and link
// render in one cell: a block nested in a Column Control column only keeps its
// first row on delivery. When a Link is authored, the picture is wrapped in an
// <a> to it and the link line is removed.

export default function decorate(block) {
  const picture = block.querySelector('picture');
  const link = [...block.querySelectorAll('a[href]')].find((a) => !a.contains(picture));
  const href = link && link.getAttribute('href');

  if (picture && href) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'image-link';
    if (link.title) a.title = link.title;
    picture.replaceWith(a);
    a.append(picture);
  }

  // Remove the link line (its value now lives on the <a>) and any row left
  // without the picture.
  if (link) {
    const line = link.closest('p, .button-container') || link;
    if (!line.contains(picture)) line.remove();
  }
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture')) row.remove();
  });
}
