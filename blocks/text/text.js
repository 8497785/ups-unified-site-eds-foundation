// Text — rich text with a multi-select Style option (Styles tab), like the
// Column Control styles. AEM's built-in Text component can't show or publish
// extra fields, so Text is a block; each chosen style is a block class
// ("quote", "blockquote", "indent"), and styles combine (e.g. Blockquote +
// Add Indent).
//
// The text stays in its authored cell so Universal Editor inline editing keeps
// working; the styling is mostly CSS.

export default function decorate(block) {
  // Delivery moves an image at the start of a paragraph into a paragraph of its
  // own. Mark those image-only paragraphs, so a style can lay the image out with
  // the following text (Quote floats it left of the text).
  block.querySelectorAll('p').forEach((p) => {
    if (p.querySelector('picture, img') && !p.textContent.trim()) p.classList.add('text-image');
  });
}
