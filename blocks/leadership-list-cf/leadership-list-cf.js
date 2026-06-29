import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ALL_ELEMENTS = ['firstName', 'lastName', 'subtitle', 'bioDetail', 'headshot'];
// Container model fields. The grouped cta link + ctaText collapse into one
// cell, so config rows are: title, cta(anchor), elements, id.
const CONFIG_ROW_COUNT = 4;

function toMasterJsonUrl(fragmentPath) {
  const clean = fragmentPath.replace(/\/$/, '').replace(/\.html$/, '');
  return `${clean}/jcr:content/data/master.json`;
}

/**
 * Derive the EDS bio page path from a CF fragment path when no explicit
 * link is authored. Bio pages are children of the current leadership page,
 * so the base is derived from the current page path — keeping it locale-aware
 * instead of a hardcoded prefix. Strips the ordering prefix (e.g. "01-a-").
 */
function deriveBioLink(fragmentPath) {
  const slug = fragmentPath.replace(/\/$/, '').split('/').pop();
  const name = slug.replace(/^\d+-[a-z]-/, '').replace(/^\d+-/, '');
  const base = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return `${base}/${name}.html`;
}

async function fetchFragment(fragmentPath) {
  try {
    const resp = await fetch(toMasterJsonUrl(fragmentPath));
    if (resp.ok) return resp.json();
  } catch (e) {
    // network/auth/CORS failure — fall through to null
  }
  return null;
}

function renderCard(li, data, bioLink, elements) {
  const anchor = document.createElement('a');
  anchor.className = 'leadership-card-link';
  anchor.href = bioLink || '#';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'leadership-card-image';
  if (elements.includes('headshot') && data.headshot) {
    const altName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const pic = createOptimizedPicture(data.headshot, altName, false, [{ width: '400' }]);
    imageWrap.append(pic);
  }

  const body = document.createElement('div');
  body.className = 'leadership-card-body';

  const nameParts = [];
  if (elements.includes('firstName') && data.firstName) nameParts.push(data.firstName);
  if (elements.includes('lastName') && data.lastName) nameParts.push(data.lastName);
  if (nameParts.length) {
    const h3 = document.createElement('h3');
    h3.textContent = nameParts.join(' ');
    body.append(h3);
  }

  if (elements.includes('subtitle') && data.subtitle) {
    const role = document.createElement('p');
    role.textContent = data.subtitle;
    body.append(role);
  }

  anchor.append(imageWrap, body);
  li.replaceChildren(anchor);
}

function renderPlaceholder(li, fragmentPath) {
  const body = document.createElement('div');
  body.className = 'leadership-card-body leadership-card-placeholder';
  const p = document.createElement('p');
  p.textContent = fragmentPath
    ? fragmentPath.split('/').pop()
    : 'Select a Content Fragment';
  body.append(p);
  li.replaceChildren(body);
}

export default async function decorate(block) {
  const rows = [...block.children];

  // First rows are the container model fields (title, elements, id);
  // every row after that is a Leadership List Item.
  const configRows = rows.slice(0, CONFIG_ROW_COUNT);
  const itemRows = rows.slice(CONFIG_ROW_COUNT);

  const titleText = configRows[0] ? configRows[0].textContent.trim() : '';
  const ctaLinkEl = configRows[1] ? configRows[1].querySelector('a') : null;
  const ctaHref = ctaLinkEl ? ctaLinkEl.getAttribute('href') : '';
  const ctaText = ctaLinkEl ? ctaLinkEl.textContent.trim() : '';
  const elementsText = configRows[2] ? configRows[2].textContent.trim() : '';
  const selectedElements = elementsText
    ? ALL_ELEMENTS.filter((el) => elementsText.toLowerCase().includes(el.toLowerCase()))
    : ALL_ELEMENTS;
  const elements = selectedElements.length ? selectedElements : ALL_ELEMENTS;

  const headerRow = document.createElement('div');
  headerRow.className = 'leadership-list-header';

  const heading = document.createElement('h2');
  heading.className = 'leadership-list-title';
  if (configRows[0]) moveInstrumentation(configRows[0], heading);
  heading.textContent = titleText;
  headerRow.append(heading);

  if (ctaText && ctaHref) {
    const cta = document.createElement('a');
    cta.className = 'leadership-list-cta';
    cta.href = ctaHref;
    cta.textContent = ctaText;
    headerRow.append(cta);
  }

  const hasHeader = titleText || (ctaText && ctaHref);

  const ul = document.createElement('ul');

  // Create an instrumented <li> per item up-front so Universal Editor keeps
  // each item selectable/editable regardless of whether the CF fetch resolves.
  const lis = itemRows.map((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const anchors = [...row.querySelectorAll('a')];
    const fragmentPath = anchors[0] ? anchors[0].getAttribute('href') : null;
    const explicitLink = anchors[1] ? anchors[1].getAttribute('href') : null;
    renderPlaceholder(li, fragmentPath);
    ul.append(li);
    return { li, fragmentPath, explicitLink };
  });

  if (hasHeader) block.replaceChildren(headerRow, ul);
  else block.replaceChildren(ul);

  // Populate each card asynchronously; failures keep the placeholder.
  await Promise.all(lis.map(async ({ li, fragmentPath, explicitLink }) => {
    if (!fragmentPath) return;
    const data = await fetchFragment(fragmentPath);
    if (!data) return;
    const bioLink = explicitLink || deriveBioLink(fragmentPath);
    renderCard(li, data, bioLink, elements);
  }));
}
