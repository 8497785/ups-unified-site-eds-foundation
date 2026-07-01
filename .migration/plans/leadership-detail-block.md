# Leadership Details Block — GraphQL (leadership-details persisted query)

## Goal
Replace the existing `leadership-details` block so it fetches a single leader's profile from the **AEM GraphQL persisted query `leadership-details`** (by CF `path`) and renders the bio detail layout matching the actual UPS site (`carol-tome.html`) and the provided AEM `biodetail` HTML.

> Execution requires **Execute mode**. Per your workflow: **no commit** (you commit manually).

## Confirmed Decisions
- **Replace** the existing `leadership-details` block (currently fetches `master.json`) → switch to the GraphQL persisted query. ✅
- **Response shape:** read `data.leaderships.list` as a **single object**. ✅
- **Host:** **relative same-origin only** (`/graphql/...`, `/content/dam/...`). Works on author/UE; will 404 on `.aem.page` (accepted). ✅
- **Headshot field:** `headshot._path` (string path). ✅ (no longer blocking)

## Endpoint
```
/graphql/execute.json/ups-global/leadership-details;path=<cfPath>
```
- project `ups-global`, query `leadership-details`, param key **`path`** (singular) = full CF path, e.g. `/content/dam/ups-assets/common/language-masters/en/leadership-bios/01-a-carol-tome`.
- Raw (unencoded) semicolon param, consistent with the working list query.

## Response Contract (confirmed)
`data.leaderships.list` (single object):
- `firstName`, `lastName` → `<h1>` name = `firstName + " " + lastName`
- `subtitle` → role `<p>`
- `bio.details` → rich HTML (paragraphs + `<b>` sub-headings) → injected via `innerHTML`
- `headshot._path` → portrait image path → `createOptimizedPicture`

## CF path input
Block keeps a single **`fragment` (aem-content)** field holding the CF path; JS reads it (anchor href or text), normalizes (strip `.html`/trailing slash), and feeds it to `;path=`.

## Layout / Styling (match source `upspr-bio`)
- Two-column row: **left** text (`col-md-8 col-lg-7` ≈ 58%), **right** portrait (`col-md-4 offset-lg-1`).
- Left: name `<h1>`, subtitle `<p>` (#767676), then `bio.details` rich HTML (16px/…, bold sub-headings).
- Right: portrait `<picture>` (~380px, rounded) from `headshot._path`.
- Reuse/extend existing `.leadership-details` CSS; tune to source (h1 size, title color, body spacing, portrait width/radius).
- Print/download affordances from the AEM markup are **out of scope** (they need AEM JS/icons).

## Risks / Notes
- **Relative-only host:** renders on author/UE; **404 on `.aem.page`** until a proxy/publish host is added — flagged, accepted.
- `bio.details` HTML → `innerHTML` (bold sub-headings preserved).
- Model stays a single CF reference; old master.json field mapping (`data.headshot`/`data.title`) replaced by GraphQL shape.
- No live GraphQL from this sandbox — validation = lint + schema + sample-JSON simulation.

## Checklist

### Phase 1 — Rewrite block (Execute mode)
- [ ] `leadership-details.js`: build relative `/graphql/execute.json/ups-global/leadership-details;path=<cfPath>`, fetch, read `data.leaderships.list` as object
- [ ] Render name (`firstName`+`lastName`), subtitle, `bio.details` (innerHTML), portrait from `headshot._path`
- [ ] Keep single `fragment` (aem-content) field in `_leadership-details.json` as query input
- [ ] Update `leadership-details.css` to match the source bio layout (two-column, typography, ~380px portrait)

### Phase 2 — Validate (no commit)
- [ ] Rebuild merged JSON if model changed; `npm run lint` (JS+CSS); validate UE model schema
- [ ] Simulate the sample JSON → confirm name/subtitle/bio/headshot map correctly
- [ ] Leave all changes uncommitted

### Execution Note
- [ ] Switch to **Execute mode** to rewrite the block + CSS (uncommitted). All inputs known: endpoint, response shape (`data.leaderships.list` object), `headshot._path`, relative host. Live render is author/UE; `.aem.page` 404s until a proxy/publish host is configured.
