import { getMetadata, createOptimizedPicture } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 992px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getLocalePrefix() {
  const { pathname } = window.location;
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})\//);
  return match ? `/${match[1]}/${match[2]}` : '';
}

async function loadNavFragment(navMeta) {
  if (navMeta) return loadFragment(new URL(navMeta, window.location).pathname);
  const prefix = getLocalePrefix();
  if (prefix) {
    const localized = await loadFragment(`${prefix}/nav`);
    if (localized) return localized;
  }
  return loadFragment('/nav');
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const fragment = await loadNavFragment(navMeta);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandButton = navBrand.querySelector('.button');
    if (brandButton) {
      brandButton.className = '';
      const container = brandButton.closest('.button-container');
      if (container) container.className = '';
    }

    // Ensure the brand always shows the logo and links to the homepage,
    // even if the authored content left the brand link empty.
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      if (!brandLink.getAttribute('href')) brandLink.setAttribute('href', '/');
      if (!brandLink.querySelector('img, picture, svg')) {
        const alt = brandLink.textContent.trim() || 'UPS';
        const pic = createOptimizedPicture('/assets/ups-logo.svg', alt, true, [{ width: '56' }]);
        const logo = pic.querySelector('img');
        if (logo) {
          logo.width = 56;
          logo.height = 67;
        }
        brandLink.textContent = '';
        brandLink.append(pic);
      }
    }
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      const subMenu = navSection.querySelector('ul');
      if (subMenu) {
        navSection.classList.add('nav-drop');
        const navLink = navSection.querySelector('a');
        if (navLink) subMenu.setAttribute('data-title', navLink.textContent.trim());
      }
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolLinks = navTools.querySelectorAll('a');
    toolLinks.forEach((link) => {
      link.classList.remove('button');
      const container = link.closest('.button-container');
      if (container) container.classList.remove('button-container');
    });

    const searchBtn = document.createElement('div');
    searchBtn.className = 'nav-tools-search';
    searchBtn.setAttribute('role', 'button');
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.setAttribute('tabindex', '0');
    searchBtn.innerHTML = '<i class="upspr upspr-icon-global-search" aria-hidden="true"></i>';
    navTools.append(searchBtn);
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
