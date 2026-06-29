# Section Spacing Control — Independent Top/Bottom Toggles (Styles Tab)

## Goal
Sections keep **both top and bottom margins by default**. Authors can independently toggle **off** the top and/or bottom margin per section. Expose these as **styling options in a "Styles" tab**, separate from the content Properties tab.

> Execution requires **Execute mode**. This artifact is the plan only.

## Confirmed Requirements (this revision)
- **Default = both margins on** (`margin: var(--spacing-xl) 0` stays). ✅
- **Two independent toggles** — author can turn off top, off bottom, or both. **Drop** the separate "No Spacing" convenience option (both-toggles-selected already covers it). ✅
- **Surface under a "Styles" tab**, not mixed into the same Properties tab. ✅
- No automatic first/last logic. ✅

## On the "Styles tab" (EDS/UE reality)
- The classic AEM hover **brush-icon style system** doesn't exist in EDS. The native equivalent is model-driven options applied as CSS classes, shown in the UE **properties rail**.
- **Tab grouping in UE:** Universal Editor renders model fields grouped by their `component: "tab"` markers within the model's `fields` array. A field of `{"component":"tab","name":"styles","label":"Styles"}` starts a new tab; fields after it appear under that tab until the next tab marker.
- **Plan:** restructure `models/_section.json` so content fields (e.g. `name`) sit under a default/Properties grouping and the spacing style options sit under a **Styles** tab.

## Design — Section Model with Styles Tab
Add a tab field then the spacing toggles. Because `style` is a **multiselect**, the two toggles combine freely.

### Toggles
- **`No Top Spacing`** (`no-top-spacing`) → `margin-top: 0;`
- **`No Bottom Spacing`** (`no-bottom-spacing`) → `margin-bottom: 0;`

### CSS to add (`styles/styles.css`)
```css
main > .section.no-top-spacing { margin-top: 0; }
main > .section.no-bottom-spacing { margin-bottom: 0; }
```

### Model change (`models/_section.json`) — illustrative shape
```json
"fields": [
  { "component": "text", "name": "name", "label": "Section Name", "...": "Properties" },
  { "component": "tab", "name": "styles", "label": "Styles" },
  {
    "component": "multiselect",
    "name": "style",
    "label": "Spacing & Style",
    "options": [
      { "name": "Highlight", "value": "highlight" },
      { "name": "Arc Background", "value": "arc-background" },
      { "name": "No Top Spacing", "value": "no-top-spacing" },
      { "name": "No Bottom Spacing", "value": "no-bottom-spacing" }
    ]
  }
]
```
(Existing `Highlight` / `Arc Background` options preserved, now living under the Styles tab alongside the spacing toggles.)

## Risks / Notes
- **Tab support verification:** must confirm this boilerplate's UE version renders `component: "tab"` grouping for the **section** model (it's standard in UE, but section models sometimes render flat). **First execution step** = verify; if a separate tab isn't supported for sections, fall back to keeping the `style` multiselect in the default panel (functionality identical, just not a separate tab) and flag it.
- **Specificity/order:** `main > .section.<toggle>` matches base specificity and overrides as it's declared later; verify cooperation with `:first-of-type`, `highlight`, `arc-background`.
- **Padding untouched:** toggles affect margin only.
- **Schema/lint:** adding a `tab` field must still pass `npm run lint` (xwalk rules) and model-schema validation.

## Checklist

### Phase 1 — Implement
- [ ] Verify UE renders a `tab`-grouped **Styles** tab for the section model; choose tab vs. flat fallback
- [ ] Add `Styles` tab marker + `No Top Spacing` / `No Bottom Spacing` options to `models/_section.json` (keep `Highlight`, `Arc Background`)
- [ ] Add `main > .section.no-top-spacing` and `.no-bottom-spacing` margin rules to `styles/styles.css`
- [ ] Leave default `margin: var(--spacing-xl) 0` and first-section rule unchanged

### Phase 2 — Validate
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (CSS + JS) passes; validate UE model schema
- [ ] Confirm toggles remove top/bottom margin and combine via multiselect
- [ ] Confirm options appear under the Styles tab in UE (or document fallback)

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) In UE Styles tab, select spacing toggle(s) per section

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3. First step verifies the Styles-tab rendering for sections.
