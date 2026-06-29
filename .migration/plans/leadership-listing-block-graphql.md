# Leadership Listing Block (GraphQL Persisted Query, Author Tier)

## Goal
Create a **brand-new, reusable** `leadership-listing` EDS block that, on page load, calls the AEM GraphQL persisted query **`/graphql/execute.json/ups-global/leadership-list`** using an author-configured **Content Fragment Root Path** and **AEM Tag(s)**, then renders the returned leadership profiles (headshot, first name, last name, subtitle, `_path`) as cards. Runs on the **AEM author tier (same-origin)**. The existing `leadership-list-cf` block is **left untouched**.

> Execution requires **Execute mode**. This artifact is the plan only.

## Confirmed Endpoint (from user)
```
/graphql/execute.json/ups-global/leadership-list;rootPath=<rootPath>;tag=<tag>
```
Example:
```
/graphql/execute.json/ups-global/leadership-list;rootPath=/content/dam/ups-assets/common/language-masters/en/leadership-bios;tag=ups_common:topics/leadership/ups_common:topics/leadership/district-manager
```
- **project/config:** `ups-global`
- **persisted query:** `leadership-list`
- **params:** `rootPath` and `tag` (note: param key is **`tag`**, singular) — both supplied **dynamically from the block config** at runtime.

## Confirmed Decisions
- **Brand-new separate block**; `leadership-list-cf` unchanged. ✅
- **Endpoint:** semicolon-encoded `execute.json` with `rootPath` + `tag`. Defaults `project=ups-global`, `queryName=leadership-list`, still exposed as **author-editable fields** for reuse. ✅
- **Fetch:** **same-origin on author** — relative `/graphql/execute.json/...` resolves with the author session. ✅
- **Tags:** **`aem-tag` multifield** — authors pick existing AEM tags; selected tag IDs feed the `tag` param. ✅
- **Card link:** derive EDS bio path from `_path` slug → `/us/en/our-company/leadership/<slug>` (strip ordering prefix e.g. `01-a-`). ✅

## Response Contract (from sample)
`data.leaderships.list[]`, each item:
- `_path` (CF path → slug→bio link)
- `headshot._path` (DAM image, same-origin)
- `firstName`, `lastName` → card name `firstName + " " + lastName`
- `subtitle` → card role line

## Block Design
- **Folder:** `blocks/leadership-listing/` → `_leadership-listing.json`, `leadership-listing.js`, `leadership-listing.css`.
- **Container model fields (Properties):**
  - `title` (text, optional heading)
  - `rootPath` (aem-content — CF folder)
  - `tags` (aem-tag, multi)
  - `project` (text, default `ups-global`)
  - `queryName` (text, default `leadership-list`)
  - `id` (text, optional)
- **JS (`leadership-listing.js`):**
  1. Read config rows (title, rootPath, tags[], project, queryName, id).
  2. Build URL: `/graphql/execute.json/{project}/{queryName};rootPath={rootPath};tag={tagValue}` (encode values; same-origin relative). Map the selected `tags` to the `tag` param (join per the endpoint's observed format).
  3. `fetch` JSON → read `data.leaderships.list`.
  4. Render each card: optimized `headshot._path` image, `firstName lastName`, `subtitle`, link → derived `/us/en/our-company/leadership/<slug>`.
  5. Graceful empty/placeholder state if unreachable or empty list.
- **CSS:** reuse the established leadership card grid (image column, name, subtitle, accent) for visual parity.
- **Register** `leadership-listing` in `models/_section.json` filter; rebuild merged JSON.

## Open Detail (resolve in execution)
- **Multi-tag param encoding:** the sample shows a single `tag=` with a slash-joined value. If multiple selected tags must be combined, I'll join them to match that observed format; if the query instead expects repeated/comma params, I'll adjust. Single-tag works as shown; multi-tag joining will mirror the example and be easy to tweak.

## Risks / Constraints
- **Author-only, same-origin:** relative `execute.json` fetch works inside the authenticated author origin. In this **sandbox I can't authenticate to author**, so no live data verification here — validation is structural (lint, schema, sample-JSON simulation) + graceful fallback. Live check happens in your author env.
- **Persisted query must exist/published in AEM** (`ups-global/leadership-list`) — block only calls it.
- **Field accuracy:** keyed to `leaderships.list`, `headshot._path`, etc.

## Checklist

### Phase 1 — Build the Block
- [ ] Create `blocks/leadership-listing/_leadership-listing.json` (title, rootPath [aem-content], tags [aem-tag multi], project=ups-global, queryName=leadership-list, id)
- [ ] Implement `leadership-listing.js`: read config → build same-origin `execute.json;rootPath=;tag=` URL → fetch → render cards from `data.leaderships.list` → derive bio link from slug → graceful fallback
- [ ] Add `leadership-listing.css` (card grid styling matching leadership design)

### Phase 2 — Register & Validate
- [ ] Add `leadership-listing` to the section filter in `models/_section.json`
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] Simulate the sample JSON against the render logic (name/subtitle/headshot/slug mapping)
- [ ] Diff-check that `leadership-list-cf` is unchanged

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) Place block, pick Root Path + Tags (project/query default to ups-global/leadership-list); verify live data in author

### Execution Note
- [ ] Switch to **Execute mode** to build Phases 1–3. Endpoint defaults are now known (`ups-global/leadership-list`, params `rootPath`+`tag`); block is fully buildable. Live data depends on the persisted query being published in your author environment.
