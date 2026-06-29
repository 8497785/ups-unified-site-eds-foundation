Let me review the current block JS and model to ground the plan.# Fix Leadership Listing GraphQL URL & Content Path Picker

## Goal
Fix the `leadership-listing` block so its GraphQL call works reliably and the author Content Path field is usable: (1) send **unencoded** semicolon params, (2) **strip the `.html` suffix** the aem-content picker appends to `rootPath`, (3) allow **searching** and **parent-level (folder) selection** in the Content Path picker. **No commit** — leave changes in the working tree for the user to commit.

> Execution requires **Execute mode**. This artifact is the plan; per your instruction, execution will make edits but **not commit/push**.

## Diagnosis (from your findings)
- **Encoding breaks it:** `encodeURIComponent` turns `/` → `%2F` and `:` → `%3A`, and the persisted query then can't parse `tag`, returning `Variable 'tag' has coerced Null value for NonNull type 'String!'`. The **unencoded** URL works:
  ```
  /graphql/execute.json/ups-global/leadership-list;rootPath=/content/dam/ups-assets/common/language-masters/en/leadership-bios;tag=ups_common:topics/leadership/executive-leadership-team
  ```
- **`.html` suffix:** the `aem-content` picker returns the path as a link href with `.html` appended (`…/leadership-bios.html`), which is invalid as a CF `rootPath`. Must strip `.html`.
- **Content Path UX:** picker currently only allows selecting a leaf item, no search, no parent/folder selection.

## Planned Changes (code only — no commit)

### 1. `leadership-listing.js` — `buildQueryUrl`
- **Remove `encodeURIComponent`** for `rootPath` and `tag`; append raw values (matching the working URL form).
- Keep params semicolon-separated: `;rootPath=<raw>;tag=<raw>`.
- Confirm tag join: single tag with internal slashes works as-is; for multiple tags, join in the form the query expects (keep current `/` join unless you confirm otherwise — flagged as open item).

### 2. `leadership-listing.js` — rootPath normalization
- Strip a trailing `.html` from the resolved `rootPath` before building the URL (also strip any trailing slash).
- Applies whether the value comes from the picker's `<a href>` or plain text.

### 3. `_leadership-listing.json` — Content Path picker config
- Adjust the `aem-content` field so it supports folder/parent selection and search:
  - Keep `rootPath: "/content/dam"` to scope the tree.
  - Add picker options to allow selecting **folders** (e.g. `"filter"`/`"selectionType"` style config) and enable search where the UE `aem-content` component supports it.
- **Caveat:** the exact `aem-content` option keys for "allow folder selection" and "search" depend on the UE component version. I can't verify picker behavior from this sandbox — I'll apply the documented options; if a key isn't honored, a **plain text Content Path field** is the guaranteed fallback.

## Open Items / Risks
- **Multi-tag format:** the working example uses a single tag containing slashes. If authors pick multiple tags, the correct param encoding (repeat `;tag=`, comma-join, or slash-join) needs confirmation. Single-tag is correct now.
- **Picker capabilities:** "search" + "parent/folder selection" are UE `aem-content` features I cannot live-test here; config may need iteration in your UE, with plain-text as the safe fallback.
- **No live verification:** GraphQL is author same-origin; I can only validate the URL string shape + lint here.

## Checklist

### Phase 1 — URL & Path Fixes (JS)
- [ ] Remove `encodeURIComponent` from `buildQueryUrl`; emit raw `rootPath`/`tag`
- [ ] Strip trailing `.html` (and trailing `/`) from resolved `rootPath`
- [ ] Re-verify the built URL matches the known-good unencoded form

### Phase 2 — Content Path Picker (model)
- [ ] Update `aem-content` `rootPath` field config to allow folder/parent selection + search (documented options)
- [ ] Note plain-text fallback if picker options aren't honored in UE

### Phase 3 — Validate (no commit)
- [ ] `npm run build:json`
- [ ] `npm run lint` (JS + CSS) and validate UE model schema
- [ ] Simulate URL build for the sample rootPath + tag → confirm it equals the working unencoded URL
- [ ] Leave all changes **uncommitted** in the working tree (user will commit)

### Execution Note
- [ ] Switch to **Execute mode** to apply Phases 1–3. I will **not** commit or push — changes stay in the working tree per your instruction.
