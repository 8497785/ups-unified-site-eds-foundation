// Image — a picture (with alt text) that is optionally clickable.
//
// Authored rows, in model order: image (+ alt), link. AEM's built-in Image
// component doesn't publish extra fields, so Image is a block: when a Link is
// authored, the picture is wrapped in an <a> to it and the link row is removed.

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

  // Only the image row is shown; the link row's value now lives on the <a>.
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture')) row.remove();
  });
}
