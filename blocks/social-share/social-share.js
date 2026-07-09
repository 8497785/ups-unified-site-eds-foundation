// Social Share — Facebook / X / LinkedIn / email / print icons generated in JS.
// Icons use the repo `upspricons` font (glyph classes defined in styles.css).
// The X (Twitter) glyph in the font is a filled close mark, so X renders as an
// inline SVG that matches the other outlined circle icons.

const X_ICON_SVG = '<svg class="upspr-social-share_svg" viewBox="0 0 40 40" width="1em" height="1em" '
  + 'aria-hidden="true" focusable="false">'
  + '<circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.5"/>'
  + '<path fill="currentColor" d="M22.9 11.5h2.6l-5.7 6.5 6.7 8.9h-5.2l-4.1-5.4-4.7 5.4H9.9l6.1-7-6.4-8.4h5.4l3.7 4.9 4.2-4.9z'
  + 'm-.9 13.9h1.4L15.6 13H14l8 12.4z"/>'
  + '</svg>';

const SHARE_ICONS = [
  {
    key: 'facebook',
    icon: 'upspr-icon-facebook-circle',
    label: 'Share on Facebook',
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: 'twitter',
    svg: X_ICON_SVG,
    label: 'Share on X',
    href: (u) => `https://twitter.com/share?url=${u}`,
  },
  {
    key: 'linkedin',
    icon: 'upspr-icon-linkedin-circle',
    label: 'Share on LinkedIn',
    href: (u) => `https://www.linkedin.com/shareArticle?mini=true&url=${u}`,
  },
  {
    key: 'email',
    icon: 'upspr-icon-mail-circle',
    label: 'Share via email',
    href: (u) => `mailto:?&body=${u}`,
  },
];

export default function decorate(block) {
  const pageUrl = encodeURIComponent(window.location.href);

  const wrap = document.createElement('div');
  wrap.className = 'upspr-social-share';
  const ul = document.createElement('ul');

  SHARE_ICONS.forEach((s) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.href(pageUrl);
    a.setAttribute('aria-label', s.label);
    a.className = 'upspr-social-share_links';
    if (s.key !== 'email') { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = s.svg ? s.svg : `<i class="upspr ${s.icon}" aria-hidden="true"></i>`;
    li.append(a);
    ul.append(li);
  });

  const printLi = document.createElement('li');
  const printBtn = document.createElement('a');
  printBtn.href = '#';
  printBtn.className = 'upspr-social-share_links';
  printBtn.setAttribute('role', 'button');
  printBtn.setAttribute('aria-label', 'Print story');
  printBtn.innerHTML = '<i class="upspr upspr-icon-print" aria-hidden="true"></i>';
  printBtn.addEventListener('click', (e) => { e.preventDefault(); window.print(); });
  printLi.append(printBtn);
  ul.append(printLi);

  wrap.append(ul);
  block.replaceChildren(wrap);
}
