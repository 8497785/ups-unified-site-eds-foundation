# Leadership Listing Block (GraphQL Persisted Query, Author Tier)

## Goal
Create a **brand-new, reusable** `leadership-listing` EDS block that, on page load, calls the AEM GraphQL persisted query **`/graphql/execute.json/ups-global/leadership-list`** using an author-configured **Content Fragment Root Path** and **AEM Tag(s)**, then renders the returned leadership profiles as cards. The **design and HTML structure must match the existing `leadership-list-cf` block exactly**. Runs on the **AEM author tier (same-origin)**. The existing `leadership-list-cf` block is **left untouched**.

> Execution requires **Execute mode**. This artifact is the plan only.

## Confirmed Endpoint
```
/graphql/execute.json/ups-global/leadership-list;rootPath=<rootPath>;tag=<tag>
```
- project/config: `ups-global`; persisted query: `leadership-list`; params **`rootPath`** + **`tag`** (singular key), both supplied dynamically from the block config.

## Confirmed Decisions
- **Brand-new separate block**; `leadership-list-cf` unchanged. ✅
- **Design + HTML structure must mirror `leadership-list-cf`** exactly (same DOM: `ul > li > a.leadership-card-link > .leadership-card-image + .leadership-card-body > h3 + p`; same CSS classes/styling). ✅
- **Endpoint defaults** `project=ups-global`, `queryName=leadership-list`, exposed as author-editable fields. ✅
- **Fetch:** same-origin relative on author. ✅
- **Tags:** `aem-tag` multifield → feed `tag` param. ✅
- **Card link:** derive `/us/en/our-company/leadership/<slug>` from `_path` (strip `01-a-` style prefix). ✅

## Match-the-Existing-Block Requirement
To guarantee parity, the new block will **reuse the existing card markup and CSS class names** from `leadership-list-cf`:
- **DOM:** `ul.leadership-card-link` structure identical — `<ul><li><a class="leadership-card-link"><div class="leadership-card-image"><picture>…</div><div class="leadership-card-body"><h3>Name</h3><p>Subtitle</p></div></a></li></ul>`.
- **Styling approach:** the new block's CSS will replicate the existing rules (card grid, image column 180px/103px, gold accent bar, h3 24px/32px #242424, subtitle 13px/21px #767676, shadow, radius, title/CTA header) — scoped under `.leadership-listing` so it's self-contained but visually identical.
- Optional: also include the existing **title** and **CTA** header styling for full parity (title + optional CTA), even if GraphQL only supplies card data.

## Response Contract (sample)
`data.leaderships.list[]`: `_path`, `headshot._path`, `firstName`, `lastName`, `subtitle`.
- name = `firstName + " " + lastName`; role = `subtitle`; image = `headshot._path` (same-origin, optimized).

## Block Design
- **Folder:** `blocks/leadership-listing/` → `_leadership-listing.json`, `leadership-listing.js`, `leadership-listing.css`.
- **Container model fields (Properties):** `title` (text), `rootPath` (aem-content), `tags` (aem-tag, multi), `project` (text, default `ups-global`), `queryName` (text, default `leadership-list`), `id` (text).
- **JS:** read config → build `/graphql/execute.json/{project}/{queryName};rootPath={rootPath};tag={tag}` → fetch → map `data.leaderships.list` → build the **same card DOM/classes** as `leadership-list-cf` → derive bio link → graceful empty/placeholder fallback.
- **CSS:** mirror `leadership-list-cf.css` rule-for-rule under `.leadership-listing` (grid, card, image sizing, accent, typography, title, optional CTA).
- **Register** in `models/_section.json` filter; rebuild merged JSON.

## Open Detail (resolve in execution)
- **Multi-tag encoding:** single `tag=` slash-joined per the example; if multiple selected tags need combining I'll mirror that format and keep it easy to adjust.

## Risks / Constraints
- **Author-only, same-origin:** can't authenticate to author from this sandbox, so no live data verification here — validation is structural (lint, schema, sample-JSON simulation) + graceful fallback. Live check in your author env.
- **Persisted query must be published** in AEM (`ups-global/leadership-list`); block only calls it.
- **Parity drift:** since CSS is duplicated (scoped to the new class), any later change to `leadership-list-cf` styling won't auto-apply here — acceptable per "separate block" requirement; noted for maintenance.

## Checklist

### Phase 1 — Build the Block (mirroring leadership-list-cf)
- [ ] Read existing `leadership-list-cf` JS + CSS to copy exact DOM structure and styles
- [ ] Create `blocks/leadership-listing/_leadership-listing.json` (title, rootPath, tags [aem-tag multi], project=ups-global, queryName=leadership-list, id)
- [ ] Implement `leadership-listing.js`: config → `execute.json;rootPath=;tag=` fetch → render identical card DOM/classes → slug→bio link → graceful fallback
- [ ] Add `leadership-listing.css` mirroring `leadership-list-cf.css` (grid, card, image, accent, typography, title/CTA) scoped to `.leadership-listing`

### Phase 2 — Register & Validate
- [ ] Add `leadership-listing` to the section filter in `models/_section.json`
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] Simulate the sample JSON → confirm rendered DOM matches `leadership-list-cf` structure (name/subtitle/headshot/slug)
- [ ] Diff-check that `leadership-list-cf` is unchanged

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) Place block, pick Root Path + Tags; verify live data + visual parity in author

### Execution Note
- [ ] Switch to **Execute mode** to build Phases 1–3. Block is fully buildable now; design/markup will be copied from `leadership-list-cf` for exact parity, and live data depends on the `ups-global/leadership-list` persisted query being published in your author environment.
