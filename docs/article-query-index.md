# Article Pages: query-index.json Generation & Page-Level Metadata

This document explains, end to end, how the press-release / article pages produce
their `query-index.json` rows and how the same values are read back at page render
time. It covers three linked layers:

1. **Migration** — where the values originate (`generate-article-jcr.mjs`).
2. **Delivery** — how they become `<head>` meta tags and how the query index
   crawler harvests them (`helix-query.yaml`).
3. **Page render** — where the block reads them back (`article-header.js`).

---

## 1. The data flow at a glance

```
source .plain.html (article-header field cells)
        │
        │  generate-article-jcr.mjs  (buildLeaf)
        ▼
JCR .content.xml  →  jcr:content @publishdate / @categorytitle / @categoryurl
        │              (+ jcr:title, jcr:description)
        │  package upload + publish (AEM → Edge Delivery pipeline)
        ▼
delivered page  →  <head> <meta name="publishdate|categorytitle|categoryurl">
        │              (+ og:title, description, og:image, robots)
        ├───────────────────────────────┐
        │                               │
        │  helix-query.yaml crawler     │  article-header.js (runtime)
        ▼                               ▼
/query-index.json rows            eyebrow title/link derived from
(title, description, image,       window.location + /query-index.json
 published, category,
 categoryUrl, lastModified,
 robots)
```

Key principle: **the query index reads from server-rendered `<head>` meta tags,
never from block DOM produced by JavaScript.** The crawler does not execute block
decoration JS, so every indexed field must exist in the delivered `<head>` (or
HTTP headers). This is why the migration writes page metadata rather than relying
on the rendered `article-header` markup.

---

## 2. Where the values originate (migration)

File: `tools/importer/generate-article-jcr.mjs`, function `buildLeaf(relPath)`.

### 2.1 Reading the source fields

The article's `.plain.html` carries the header data as field-comment cells inside
`.article-header`:

```js
const header = document.querySelector('.article-header');
const byField = {};
[...header.querySelectorAll(':scope > div > div')].forEach((cell) => {
  const m = cell.innerHTML.match(/<!--\s*field:(\w+)\s*-->/);
  if (m) byField[m[1]] = cell.innerHTML.replace(/<!--\s*field:\w+\s*-->/, '').trim();
});

const eyebrow     = text(byField.eyebrow);      // e.g. "Customer First"
const title       = (byField.title || '').trim();     // <h1>…</h1>
const pageTitle   = text(title) || 'Article';         // plain-text headline
const description = (byField.description || '').trim();// <p>…</p>
const articleDate = text(byField.articleDate);        // e.g. "11-02-2021" (MM-DD-YYYY)
```

### 2.2 Deriving the three auto metadata values

```js
// publishDate: original article date (ISO) if present, else today's date (ISO).
const publishDate   = isoDate(articleDate) || new Date().toISOString().slice(0, 10);
const categoryTitle = eyebrow;                 // Category Title = eyebrow text
const categoryHref  = categoryUrl(relPath);    // parent path, relative, no .html
```

**`isoDate(raw)`** normalizes `MM-DD-YYYY` → `YYYY-MM-DD`:

```js
const isoDate = (raw) => {
  const s = (raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/); // MM-DD-YYYY
  if (m) { const [, mm, dd, yyyy] = m; return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`; }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};
```

- If `articleDate` exists → ISO form of it.
- If not → falls back to the page's publish date (generation time, ISO).

**`categoryUrl(relPath)`** = the leaf page's parent path (article slug dropped),
kept relative, locale root intact, no `.html`:

```js
const categoryUrl = (relPath) => `/${relPath.split('/').slice(0, -1).join('/')}`;
// language-masters/en/newsroom/press-releases/customer-first/<slug>
//   -> /language-masters/en/newsroom/press-releases/customer-first
```

> Note: at migration time the package path is under `language-masters/en`, so the
> emitted `categoryurl` metadata uses that root. The **live eyebrow link** is
> corrected per-page at render time (see §4), so it is always root-correct
> (`/us/en/...` on a `/us/en` page).

### 2.3 Writing to the JCR (page-level properties)

The three values are written as attributes on `jcr:content` and registered in
`modelFields` so the core Franklin page component renders them as `<head>` meta
tags:

```xml
<jcr:content
    cq:template="/libs/core/franklin/templates/page"
    sling:resourceType="core/franklin/components/page/v1/page"
    jcr:primaryType="cq:PageContent"
    jcr:title="…headline…"
    jcr:description="…description…"
    publishdate="2021-11-02"
    categorytitle="Customer First"
    categoryurl="/language-masters/en/newsroom/press-releases/customer-first"
    modelFields="[jcr:title,jcr:description,keywords,publishdate,categorytitle,categoryurl]">
```

- `jcr:title` ← the article headline (`pageTitle`), not a placeholder.
- `jcr:description` ← the description text (tags stripped).
- `publishdate` / `categorytitle` / `categoryurl` ← the derived values above.

---

## 3. How query-index.json is generated (delivery)

File: `helix-query.yaml`. Two indices are defined.

### 3.1 Site-wide index (`pages`) → `/query-index.json`

Covers `/**`; every published page becomes a row. This is the index the article
listing and the eyebrow lookup consume.

### 3.2 Section index (`press-releases`) → `/us/en/newsroom/press-releases/query-index.json`

Scoped to `/us/en/newsroom/press-releases/**`. Same property set; kept as a
narrower feed for that section.

### 3.3 Indexed properties (identical in both indices)

| Field         | Source selector / value                                             | Origin |
|---------------|---------------------------------------------------------------------|--------|
| `title`       | `head > meta[property="og:title"]` → `content`                      | og:title meta |
| `description` | `head > meta[name="description"]` → `content`                       | description meta |
| `image`       | `head > meta[property="og:image"]` → `content`                      | og:image meta |
| `published`   | `head > meta[name="publishdate"]` → `content`                       | `publishdate` (§2.2) |
| `category`    | `head > meta[name="categorytitle"]` → `content`                     | `categorytitle` (§2.2) |
| `categoryUrl` | `head > meta[name="categoryurl"]` → `content`                       | `categoryurl` (§2.2) |
| `lastModified`| `parseTimestamp(headers["last-modified"], …)`                       | HTTP header |
| `robots`      | `head > meta[name="robots"]` → `content`                            | robots meta |

Every field except `lastModified` reads a `<head>` element, i.e. the metadata the
migration emitted (§2.3) or the page's standard SEO meta tags. `lastModified`
comes from the HTTP `last-modified` header (the publish time), independent of
`published`.

### 3.4 When the index refreshes

The pipeline regenerates the target `query-index.json` when a page whose path
matches the index `include` glob is **previewed or published**. It is automatic
but not instant (seconds to a couple of minutes), and only reflects
previewed/published pages. Existing pages published before the config existed need
a one-time (re)publish to appear.

### 3.5 Example row

```json
{
  "path": "/us/en/newsroom/press-releases/customer-first/ups-brown-friday",
  "title": "UPS Aims to Hire 60,000 At 'UPS Brown Friday' Events Nationwide",
  "description": "UPS announced today that it expects to hire at least 60,000…",
  "image": "/content/dam/upsstories/images/newsroom/press-releases/1440x752_PeakHiring.jpg",
  "published": "2021-11-02",
  "category": "Customer First",
  "categoryUrl": "/language-masters/en/newsroom/press-releases/customer-first",
  "lastModified": "1699000000",
  "robots": "index, follow"
}
```

---

## 4. Where the values are read at page level

File: `blocks/article-header/article-header.js` (runs on each article page).

The Article Header's **eyebrow** (category label + link) is not authored on the
page; it is derived at render time so it stays correct on any locale root and
never carries `.html`.

### 4.1 Parent category path (drives the eyebrow link)

```js
function parentCategoryPath() {
  const clean = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const parent = clean.split('/').slice(0, -1).join('/');
  return parent || '/';
}
```

Root-preserving: on `/us/en/.../<slug>` it yields `/us/en/.../customer-first`; on
`/language-masters/en/...` it yields that root. No `.html`.

### 4.2 Eyebrow link resolution (authored value wins)

```js
const eyebrowHref = eyebrowLinkRow?.querySelector('a')?.getAttribute('href')
  || cellText(eyebrowLinkRow)
  || categoryPath;                 // derived fallback
```

### 4.3 Eyebrow title resolution (authored → index → meta → humanized)

```js
let eyebrowText = cellText(eyebrowRow);
if (!eyebrowText) {
  eyebrowText = await categoryTitleFromIndex(categoryPath)  // /query-index.json lookup
    || getMetadata('categorytitle')                         // publishdate/category meta
    || humanize(categoryPath);                              // last-resort from path
}
```

**`categoryTitleFromIndex`** fetches the site-wide index and matches the parent
row by path:

```js
async function categoryTitleFromIndex(parentPath) {
  const resp = await fetch('/query-index.json');
  if (!resp.ok) return '';
  const { data = [] } = await resp.json();
  const row = data.find((r) =>
    (r.path || '').replace(/\.html$/, '').replace(/\/$/, '') === parentPath);
  return row ? (row.title || row.category || '') : '';
}
```

So the eyebrow title comes from the parent (category) page's `title`/`category`
row in `/query-index.json`, with graceful fallbacks:

1. **Authored** eyebrow cell (if an author typed one).
2. **Query index** row for the parent path (`title`, then `category`).
3. **`categorytitle`** page meta (the value migration emitted, §2.3).
4. **Humanized** last path segment (e.g. `customer-first` → "Customer First").

### 4.4 What is NOT read from the index

`articleDate` and read-time are still rendered from the authored `article-header`
cells (`dateRow`), unchanged. The `publishdate` meta exists for the query index /
SEO consumers; the visible date in the hero comes from the block's own date cell.

---

## 5. File reference

| Concern | File |
|---|---|
| Emit page metadata (`publishdate`, `categorytitle`, `categoryurl`) + `jcr:title`/`jcr:description` | `tools/importer/generate-article-jcr.mjs` (`buildLeaf`, `isoDate`, `categoryUrl`) |
| Define the query indices and their field selectors | `helix-query.yaml` (`pages`, `press-releases`) |
| Read the values back at render time (eyebrow title/link) | `blocks/article-header/article-header.js` |
| Page-metadata model (title/description/keywords) | `models/_page.json` |

---

## 6. Operational notes

- **Changes to `helix-query.yaml` or page metadata take effect only after
  (re)publish.** Re-upload the content package, then publish the pages so the
  pipeline re-renders `<head>` and refreshes `query-index.json`.
- **`published` vs `lastModified`:** `published` is the real article date (or the
  fallback publish date) from page metadata; `lastModified` is the delivery
  publish timestamp from the HTTP header. Use `published` for chronological
  article sorting.
- **Locale roots:** the query index keys off the served URL path. The `pages`
  index (`/**`) covers every root, so one `/query-index.json` serves `/us/en` and
  `/language-masters/en` pages alike; the eyebrow lookup filters by the current
  page's parent path.
