import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const ALL_ELEMENTS = ['firstName', 'lastName', 'subtitle', 'bioDetail', 'headshot'];

/**
 * Build the master.json URL for a Content Fragment reference path.
 * Accepts a fragment path like /content/dam/.../leadership-bios/01-a-carol-tome
 */
function toMasterJsonUrl(fragmentPath) {
  const clean = fragmentPath.replace(/\/$/, '').replace(/\.html$/, '');
  return `${clean}/jcr:content/data/master.json`;
}

/**
 * Derive the EDS bio page path from a CF fragment path when no explicit
 * link is authored. Strips the ordering prefix (e.g. "01-a-") from the slug.
 */
function deriveBioLink(fragmentPath) {
  const slug = fragmentPath.replace(/\/$/, '').split('/').pop();
  const name = slug.replace(/^\d+-[a-z]-/, '').replace(/^\d+-/, '');
  return `/us/en/our-company/leadership/${name}`;
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

function buildCard(data, bioLink, elements) {
  const li = document.createElement('li');

  const anchor = document.createElement('a');
  anchor.className = 'leadership-card-link';
  anchor.href = bioLink;

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
  li.append(anchor);
  return li;
}

export default async function decorate(block) {
  const rows = [...block.children];

  // Item rows contain a CF reference anchor; config rows (title/elements/id) do not.
  const itemRows = rows.filter((row) => row.querySelector('a'));
  const configRows = rows.filter((row) => !row.querySelector('a'));

  // Container config in model order: title, elements, id.
  const elementsText = configRows[1] ? configRows[1].textContent.trim() : '';
  const selectedElements = elementsText
    ? ALL_ELEMENTS.filter((el) => elementsText.toLowerCase().includes(el.toLowerCase()))
    : ALL_ELEMENTS;
  const elements = selectedElements.length ? selectedElements : ALL_ELEMENTS;

  const ul = document.createElement('ul');

  const items = await Promise.all(itemRows.map(async (row) => {
    const anchors = [...row.querySelectorAll('a')];
    const fragmentPath = anchors[0] ? anchors[0].getAttribute('href') : null;
    const explicitLink = anchors[1] ? anchors[1].getAttribute('href') : null;
    if (!fragmentPath) return null;

    const data = await fetchFragment(fragmentPath);
    if (!data) return null;

    const bioLink = explicitLink || deriveBioLink(fragmentPath);
    const li = buildCard(data, bioLink, elements);
    moveInstrumentation(row, li);
    return li;
  }));

  items.filter(Boolean).forEach((li) => ul.append(li));
  block.replaceChildren(ul);
}
