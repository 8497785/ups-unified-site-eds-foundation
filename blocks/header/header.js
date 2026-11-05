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

function setNavSectionExpanded(section, expanded) {
  section.setAttribute('aria-expanded', expanded);
  const toggle = section.querySelector(':scope > .nav-drop-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', expanded);
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    setNavSectionExpanded(section, expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  // items start collapsed; on mobile their chevrons expand them one at a time
  toggleAllNavSections(navSections, 'false');
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

/**
 * Builds the search panel revealed by the header search button.
 * Opens over the nav sections and tools, dims the page, and closes via
 * the close button, the Escape key, or a click on the dimmed page.
 * @param {Element} nav The nav element
 * @param {Element} toggle The search button in the nav tools
 */
function decorateSearch(nav, toggle) {
  const panel = document.createElement('div');
  panel.id = 'nav-search';
  panel.className = 'nav-search';
  panel.hidden = true;
  panel.innerHTML = `<form class="nav-search-form" role="search" action="${getLocalePrefix()}/search" method="get">
      <button type="submit" class="nav-search-submit" aria-label="Submit search">
        <i class="upspr upspr-icon-global-search" aria-hidden="true"></i>
      </button>
      <input type="search" name="q" class="nav-search-input" placeholder="Search About UPS" aria-label="Search About UPS" autocomplete="off" required>
      <button type="button" class="nav-search-clear" aria-label="Clear search" hidden>Clear</button>
    </form>
    <button type="button" class="nav-search-close" aria-label="Close search">
      <i class="upspr upspr-icon-x-circle" aria-hidden="true"></i>
    </button>`;

  const overlay = document.createElement('div');
  overlay.className = 'nav-search-overlay';
  overlay.hidden = true;

  const input = panel.querySelector('input');

  // "Clear" pill inside the field, shown only while there is text to clear
  const clear = panel.querySelector('.nav-search-clear');
  const syncClear = () => { clear.hidden = !input.value; };
  input.addEventListener('input', syncClear);
  clear.addEventListener('click', () => {
    input.value = '';
    syncClear();
    input.focus();
  });

  const closeSearchOnEscape = (e) => {
    if (e.code === 'Escape') {
      e.stopImmediatePropagation();
      // eslint-disable-next-line no-use-before-define
      setOpen(false);
    }
  };

  const setOpen = (open, { restoreFocus = true } = {}) => {
    panel.hidden = !open;
    overlay.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('search-open', open);
    if (open) {
      // capture phase so the nav's own Escape handling doesn't also run
      window.addEventListener('keydown', closeSearchOnEscape, true);
      syncClear();
      input.focus();
    } else {
      window.removeEventListener('keydown', closeSearchOnEscape, true);
      if (restoreFocus) toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  panel.querySelector('.nav-search-close').addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false, { restoreFocus: false }));
  // tabbing out of the panel closes it, leaving focus where the user moved it
  panel.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !panel.contains(e.relatedTarget)) {
      setOpen(false, { restoreFocus: false });
    }
  });

  nav.append(panel, overlay);
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
      brandLink.setAttribute('href', '/us/en/home');
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
        const title = navLink ? navLink.textContent.trim() : '';
        if (title) subMenu.setAttribute('data-title', title);

        // mobile drawer: chevron button that shows or hides this item's links
        const dropToggle = document.createElement('button');
        dropToggle.type = 'button';
        dropToggle.className = 'nav-drop-toggle';
        dropToggle.setAttribute('aria-expanded', 'false');
        dropToggle.setAttribute('aria-label', `${title} menu`);
        dropToggle.innerHTML = '<i class="upspr upspr-icon-chevrondown" aria-hidden="true"></i>';
        dropToggle.addEventListener('click', () => {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          setNavSectionExpanded(navSection, expanded ? 'false' : 'true');
        });
        subMenu.before(dropToggle);
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

    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'nav-tools-search';
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.setAttribute('aria-expanded', 'false');
    searchBtn.setAttribute('aria-controls', 'nav-search');
    searchBtn.innerHTML = '<i class="upspr upspr-icon-global-search" aria-hidden="true"></i>';
    navTools.append(searchBtn);
    decorateSearch(nav, searchBtn);
  }

  // mobile drawer: logo at the top, tool links at the bottom, dimmed page behind
  if (navSections) {
    const brandLink = navBrand && navBrand.querySelector('a');
    if (brandLink) {
      const drawerBrand = document.createElement('div');
      drawerBrand.className = 'nav-drawer-brand';
      drawerBrand.append(brandLink.cloneNode(true));
      navSections.prepend(drawerBrand);
    }
    const toolLinks = navTools ? [...navTools.querySelectorAll('p a')] : [];
    if (toolLinks.length) {
      const drawerTools = document.createElement('div');
      drawerTools.className = 'nav-drawer-tools';
      drawerTools.append(...toolLinks.map((link) => link.cloneNode(true)));
      navSections.append(drawerTools);
    }
    const drawerOverlay = document.createElement('div');
    drawerOverlay.className = 'nav-drawer-overlay';
    drawerOverlay.addEventListener('click', () => toggleMenu(nav, navSections, false));
    nav.append(drawerOverlay);
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
