# Generic Query-Index Listing Block (`content-list`)

## Key change this turn: the block is section-agnostic

The listing block is **no longer press-release specific**. The author supplies the query-index path (and/or a path filter) as a **block property**, and the block fetches/renders whatever that index contains. So the same block can power the press-releases page today and any other listing (newsroom, stories, etc.) later — driven entirely by authored properties, no code changes.

This affects naming and fields (below); all other confirmed decisions stand.

## Decisions locked

| Decision | Choice |
|---|---|
| Block scope | **Generic** — index path is an author property, not hardcoded |
| Block name / model id | **`content-list`** (generic; supersedes `press-list`) |
| Data source | Author-provided `indexPath` (defaults to the press-releases section index for this page) |
| Card content | Image, formatted date, linked title, short description |
| Order | Newest first (by `published` desc) |
| Paging | "Load more" — 12 initial, +12 per click |
| Author experience | **A — placeholder notice + skeleton cards** (query-index not served in author) |
| Image aspect | **Fixed ratio (uniform, 16:9 crop)** |
| Date format | Any reasonable readable format (e.g. `Nov 2, 2021`) |
| Page build | Block only — manual authoring, no generator/package |

> Implementation requires **Execute mode** — this artifact is the finalized design.

## New block: `content-list`

### Files
- `blocks/content-list/content-list.js`
- `blocks/content-list/content-list.css`
- `blocks/content-list/_content-list.json`

### Model fields (authorable — this is how the author targets any section)
- **`indexPath`** (text) — the `query-index.json` URL to fetch. Default `/us/en/newsroom/press-releases/query-index.json` (so it works out-of-the-box on this page, but the author can point it at any index).
- **`filterPrefix`** (text, optional) — when set, only rows whose `path` starts with this prefix are shown. Lets an author use the **site-wide `/query-index.json`** and scope it to a section (e.g. `/us/en/newsroom/press-releases/`) without a dedicated index. Empty = show all rows from `indexPath`.
- `pageSize` (number) — default `12`.
- `loadMoreLabel` (text) — default `Load more`.

This gives two authoring modes: point at a **pre-scoped section index** (no filter), or point at a **broad index + `filterPrefix`**. Author decides per placement.

### Behavior (`content-list.js`)
1. Read `indexPath` / `filterPrefix` / `pageSize` / `loadMoreLabel` from block cells; fall back to defaults.
2. **Author host** (`hostname.endsWith('.adobeaemcloud.com')`) → render placeholder notice + skeleton cards; skip fetch; return.
3. Else `fetch(indexPath)` → `{ data }`. On failure/empty → quiet empty state; never throw.
4. If `filterPrefix` set → keep rows whose `path` starts with it.
5. Sort by `published` **desc** (ISO parse; undated last).
6. Render `<ul>` of card `<li>`s: optimized image (fixed-ratio via CSS), formatted date, title `<a href={row.path}>`, clamped description.
7. **Load more:** first `pageSize`; append `pageSize` per click; hide when exhausted.
8. Match `cards-story` conventions (`createOptimizedPicture`, `moveInstrumentation`).

### CSS (`content-list.css`)
- Responsive card grid; fixed 16:9 image crop (`aspect-ratio: 16/9; object-fit: cover`); small date text; emphasized title; line-clamped description; skeleton/notice styling for author placeholder.

### Registration
- `_content-list.json` (model + definition, name "Content List", model `content-list`); `npm run build:json`.
- Add `content-list` to the **section-level filter** so it's placeable in any section (not tied to a press-release template).

## Reused pieces (no changes)
- **Breadcrumb** — dynamic (Home / Newsroom / Press Releases).
- **Headline** — richtext `title` → `<h1>` ("Press Releases").
- Author composes the page: breadcrumb + headline + `content-list` (with `indexPath` set to the press-releases index).

## Data contract (index fields used)
`path`, `title`, `description`, `image`, `published` (ISO), `category`, `categoryUrl`. Card uses `image`, `published`, `title`, `description`, `path`. `filterPrefix` matches against `path`.

## Risks / notes
- **Author shows placeholder, not data** — by design (query-index is delivery-tier only).
- **Index must be published** for live data.
- **Local preview:** index may not resolve on the dev server; I'll unit-test sort/filter/paging/format logic and flag that live verification needs the published index rather than claim it renders.
- **Author must set a valid `indexPath`** for the target section; default covers this page. Wrong/unpublished path → graceful empty state.

## Checklist

- [ ] Create `blocks/content-list/_content-list.json` — model (`indexPath`, `filterPrefix`, `pageSize`, `loadMoreLabel`) + definition (name "Content List", model `content-list`) — **Execute mode**
- [ ] Implement `blocks/content-list/content-list.js`: read props; author-host placeholder branch; else fetch `indexPath`, optional `filterPrefix` path filter, sort newest-first, render image/date/title-link/description, "Load more" (12/+12), graceful empty/error (never throw)
- [ ] Implement `blocks/content-list/content-list.css`: responsive grid, fixed 16:9 image crop, clamped description, skeleton/notice styles
- [ ] Register model: `npm run build:json`; add `content-list` to the section filter so it's placeable in any section
- [ ] Lint `content-list.js`; validate JSON model build succeeds
- [ ] Unit-test sort (newest-first), `filterPrefix` filtering, date formatting, load-more slicing
- [ ] Attempt local preview; document that live data requires a published query-index (author shows placeholder by design)
- [ ] Do NOT modify breadcrumb/headline; do NOT build a JCR generator/package this task
- [ ] Commit & push the new block (+ merged model JSON)
- [ ] (Follow-up, optional) Deterministic generator to assemble the full listing page (breadcrumb + headline + content-list) into the upload package
