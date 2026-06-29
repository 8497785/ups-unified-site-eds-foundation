# Leadership Listing Block (GraphQL + Root Path + Tags)

## Goal
Create a **brand-new, reusable** Leadership Listing block in EDS that dynamically displays leadership profiles from AEM Content Fragments via an **AEM GraphQL persisted query**. Authors configure a **Content Fragment Root Path** and **one or more Tags**; on load, the block runs the persisted query with those values and renders the returned profiles (headshot, first name, last name, subtitle, CF path) as leadership cards. The existing `leadership-list-cf` block is **not touched**.

> Execution requires **Execute mode**. This artifact is the plan only.

## Requirements (from the document)
- **Data flow:** author sets Root Path + Tag(s) → block reads config on page load → invokes **GraphQL persisted query** → receives matching profiles → renders cards.
- **Returned fields per profile:** `headshot`, `firstName`, `lastName`, `subtitle`, CF `path`.
- **Reusable:** one block + one GraphQL query powers many leadership pages; authors change folder/tags only — no new development.

## Confirmed Decisions
- **Brand-new separate block** (own name, model, JS, CSS); `leadership-list-cf` untouched. ✅
- **Data source:** AEM GraphQL **persisted query**, filtered by root path + tags (not manual CF selection, not per-item `master.json` fetch). ✅

## Blocking Inputs Needed Before Execution
The GraphQL specifics are environment-dependent and must be exact, or the block won't fetch:
- [ ] **Persisted query name/path** (e.g. `/graphql/execute.json/<project>/<queryName>`).
- [ ] **GraphQL host/origin** to call (publish tier vs same-origin proxy; author needs auth/CORS).
- [ ] **Query parameter contract**: how root path + tags are passed (variables, semicolon-encoded persisted-query args, or `_path`/`_tags` filter).
- [ ] **CF model name** backing the query and the exact field names returned (confirm `headshot/firstName/lastName/subtitle/_path`).
- [ ] **Tag format** expected (e.g. `ups:leadership/board-of-directors`).
- [ ] **Card link target**: CF path → which page URL (e.g. derive `/our-company/leadership/<slug>` like the existing block, or use a returned field).

## Proposed Architecture (pending the inputs above)
- **New block** `blocks/leadership-listing/` → `_leadership-listing.json`, `leadership-listing.js`, `leadership-listing.css`.
- **Model (container, Properties)** fields:
  - `title` (text, optional heading)
  - `rootPath` (aem-content — Content Fragment folder)
  - `tags` (aem-tag, multi)
  - optional: `orderBy`, `maxItems`, `id`
- **JS:** read config from the block's rendered rows → build persisted-query URL with rootPath + tags → `fetch` JSON → map results → render cards (headshot, firstName+lastName, subtitle) linking to each profile. Graceful fallback (empty/placeholder) if the query is unreachable (e.g., unauthenticated sandbox).
- **CSS:** reuse the established card grid styling (image, name, subtitle) to match the leadership card design.
- **Register** in `models/_section.json` filter; rebuild merged JSON.

## Risks / Constraints
- **GraphQL reachability:** author host needs auth + CORS; from a plain browser the persisted query must be reachable same-origin or via publish tier. Same constraint that blocked CF `master.json` earlier — the block will render only where the endpoint is reachable; I'll add a graceful empty-state.
- **Persisted query must exist in AEM** — the EDS block only *calls* it; creating/publishing the query itself is an AEM-author task outside this repo. I'll flag if it's not yet provisioned.
- **Field-name accuracy:** card rendering depends on exact GraphQL field names; wrong names = blank cards.
- **Sandbox limitation:** I likely can't live-verify the fetch here (auth); validation will be structural (lint, schema, code review) plus a graceful-fallback check.

## Checklist

### Phase 0 — Confirm GraphQL Contract (blocking)
- [ ] Persisted query name/path + host/origin
- [ ] Parameter contract for rootPath + tags; tag format
- [ ] CF model + exact returned field names
- [ ] Card link-target rule

### Phase 1 — Build the Block
- [ ] Create `blocks/leadership-listing/_leadership-listing.json` (container model: title, rootPath, tags, optional order/max/id)
- [ ] Implement `leadership-listing.js` (read config → call persisted query → render cards → graceful fallback)
- [ ] Add `leadership-listing.css` (card grid styling matching leadership design)

### Phase 2 — Register & Validate
- [ ] Add `leadership-listing` to the section filter in `models/_section.json`
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] Diff-check that `leadership-list-cf` is unchanged

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) Ensure the persisted query is created/published in AEM; configure a page with Root Path + Tags to verify live

### Execution Note
- [ ] Provide the Phase 0 GraphQL details, then switch to **Execute mode**. I can scaffold the block with sensible defaults if you prefer, but the persisted-query name, host, and parameter contract are required for it to actually fetch.
