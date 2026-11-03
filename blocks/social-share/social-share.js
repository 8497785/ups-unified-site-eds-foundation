// Social Share — Facebook / X / LinkedIn / email / print icons generated in JS.
// Icons use the repo `upspricons` font (glyph classes defined in styles.css),
// as on about.ups.com. The X glyph (upspr-icon-twitter-circle) comes from the
// small `upspricons-x` font (fonts.css), as the source's second icon font.

const SHARE_ICONS = [
  {
    key: 'facebook',
    icon: 'upspr-icon-facebook-circle',
    label: 'Share on Facebook',
    href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: 'twitter',
    icon: 'upspr-icon-twitter-circle',
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
    a.innerHTML = `<i class="upspr ${s.icon}" aria-hidden="true"></i>`;
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
