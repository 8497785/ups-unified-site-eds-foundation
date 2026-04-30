export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const picture = block.querySelector('picture');
  const stats = [];
  let ctaLink = null;

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const value = cells[0]?.textContent?.trim();
      const label = cells[1]?.textContent?.trim();
      if (value && label && !cells[0].querySelector('picture') && !cells[0].querySelector('a')) {
        stats.push({ value, label });
      }
    }
    const link = row.querySelector('a');
    if (link && !row.querySelector('picture')) {
      ctaLink = link;
    }
  });

  block.textContent = '';

  if (picture) {
    block.append(picture);
  }

  const content = document.createElement('div');
  content.className = 'stats-content';

  if (stats.length > 0) {
    const list = document.createElement('ul');
    list.className = 'stats-list';
    stats.forEach((stat) => {
      const item = document.createElement('li');
      item.className = 'stat-item';
      item.innerHTML = `<span class="stat-value">${stat.value}</span><span class="stat-label">${stat.label}</span>`;
      list.append(item);
    });
    content.append(list);
  }

  if (ctaLink) {
    const cta = document.createElement('a');
    cta.className = 'stats-cta';
    cta.href = ctaLink.href;
    cta.textContent = ctaLink.textContent.replace(/\s+/g, ' ').trim();
    content.append(cta);
  }

  block.append(content);
}
