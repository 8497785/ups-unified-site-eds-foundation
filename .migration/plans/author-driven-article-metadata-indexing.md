Let me check the current `articleDate` field definition to plan the component change accurately.I have what I need. The `articleDate` field is a plain `text` component; you want a **date-time picker** component, and the block must **format the ISO datetime value to a date-only display** (stripping the `T00:00:00.000Z` timestamp). Let me confirm one detail about the desired display format.# Article Date → Date-Time Picker Field + Date-Only Rendering

## Objective

Change the Article Header's **Article Date** from a plain text field to a **date-time picker** (so authors select a date instead of typing free text), and fix rendering so the page shows a **clean date only** — not the raw ISO timestamp (`2026-07-20T00:00:00.000Z`). Per decisions:

- **Display format:** `MM-DD-YYYY` (e.g. `07-20-2026`), matching the original migrated article style.
- **Back-compat:** the block must render **both** the new ISO datetime values (timestamp stripped) **and** the existing plain-text dates already on the 39 migrated pages (e.g. `11-02-2021`) — no regression.

> This plan also carries forward the still-open metadata/query-index work from the prior turn (date/category/link missing on manually-authored pages). Implementation requires **Execute mode.**

## Root cause of the timestamp display

`articleDate` is currently a `text` component; you typed dates, and the block rendered the cell text verbatim. With a date-time picker, the stored value becomes an ISO string (`2026-07-20T00:00:00.000Z`), and the block currently prints that raw string — hence the timestamp showing. The block needs to **parse + format to `MM-DD-YYYY`**.

## Changes

### Part A — Field becomes a date-time picker (`_article-header.json`)
- Change `articleDate` field `component` from `text` to the date-time picker component (`aem-datetime` / the datetime picker type supported by the UE field-types), keeping `name: articleDate`.
- Set `valueType` appropriately for a datetime value; update the label/description ("Select the article date").
- Run `npm run build:json` to regenerate the merged component JSON. Verify the field renders as a picker (not plain text) in UE.

### Part B — Block renders date-only, both formats (`article-header.js`)
- Add a `formatArticleDate(raw)` helper:
  - **ISO datetime** (contains `T` / parseable by `Date`) → format to `MM-DD-YYYY` using UTC parts (avoid off-by-one from timezone; the value is `…T00:00:00.000Z`).
  - **Already `MM-DD-YYYY`** (migrated plain text) → render as-is.
  - **Other parseable text** (e.g. `June 22, 2026`, `2026-06-22`) → format to `MM-DD-YYYY`.
  - Blank/unparseable → render nothing (no "Invalid Date").
- Apply it to the byline date span; keep read-time logic unchanged.

### Part C (carried over) — Content-authored metadata for the index
Still-open from the prior turn: manually-authored pages have no `publishdate`/`categorytitle`/`categoryurl` head meta, so those columns are empty in `query-index.json`. The index crawler doesn't run block JS, so it must read from server HTML. Repoint the query-index `published`/`category`/`categoryUrl` selectors to read the authored **article-header block cells** (present in `.plain.html`), so both migrated and hand-authored pages populate. (Confirm scope with the checklist item; this is the only approach that actually fills the index.)

## Open items to resolve at execution
- **Exact date-time picker component id** the UE build supports (`aem-datetime` vs `datetime`) and its `valueType` — verify against the field-types spec / an existing datetime field in the project before committing.
- **Part C direction** — confirm we implement the index-reads-from-block-cells approach (the block-writes-meta option discussed earlier does not populate the index).

## Risks / Notes
- **Timezone off-by-one:** `…T00:00:00.000Z` parsed in a negative-offset timezone can render the previous day if using local getters — use UTC date parts for formatting.
- **Re-publish required:** field/model change takes effect in UE after the `component-*.json` code-sync; index/metadata refresh only after pages are (re)published.
- **Existing pages:** migrated pages keep their `11-02-2021`-style values and still render correctly (back-compat branch). Authors re-picking the date will store ISO going forward.
- **Verified-locally caveat:** field-render in UE and live index population must be spot-checked after deploy/publish; I can verify the block formatting logic and JSON build locally.

## Checklist

- [ ] Confirm the date-time picker component id + valueType supported by this UE build (check field-types spec / existing datetime field) — **needs verification at execution**
- [ ] `_article-header.json`: change `articleDate` to the date-time picker component; update label/description; keep `name: articleDate`
- [ ] `npm run build:json`; verify merged model shows the datetime component (field renders as a picker, not plain text)
- [ ] `article-header.js`: add `formatArticleDate()` — ISO datetime → `MM-DD-YYYY` (UTC parts); pass through existing `MM-DD-YYYY`; parse other date text; blank/unparseable → render nothing
- [ ] Apply formatting to the byline date; leave read-time and other fields unchanged
- [ ] Lint `article-header.js`; validate JSON build
- [ ] (Carried over) Repoint `helix-query.yaml` published/category/categoryUrl to read from the article-header block cells so authored pages populate the index — confirm direction first
- [ ] Verify on the published `test-article`: date shows `MM-DD-YYYY` (no timestamp); migrated pages still show their dates
- [ ] Verify query-index row for `test-article` populates published/category/categoryUrl (after the Part C change + publish)
- [ ] Commit & push; note pages must be (re)published and UE reloaded for field + index changes to take effect
