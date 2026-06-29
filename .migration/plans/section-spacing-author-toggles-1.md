# Section Spacing Control — Author Toggles (EDS Style Approach)

## Your Question: Is there an AEM-style "brush icon" style system in EDS?
**Short answer:** Not the identical hover-brush UX, but Universal Editor has an equivalent, model-driven mechanism — and it's exactly what this plan uses.

- **Classic AEM style system** (hover → brush/paint icon → toggle policy-defined styles) is a **WCM core-component + content-policy** feature of the traditional Page Editor. It does **not** exist in that exact form in EDS/Universal Editor.
- **EDS / Universal Editor equivalent:** styles are declared in the block/section **model JSON** as a field (typically a `multiselect` named `style`). In the UE **properties rail** the author sees these as selectable options (checkbox/multiselect chips), and each selected value is applied as a **CSS class** on the section/block. UE component dialogs can also surface a dedicated **"Styles" tab** (as seen in your existing CF List dialog's Properties | Elements | **Styles** tabs).
- So the UPS boilerplate's `section` `style` multiselect (`Highlight`, `Arc Background`) **is** the EDS style system. Adding spacing toggles there gives authors the same "pick a style to toggle appearance" capability — just via the properties panel rather than a canvas brush icon.

> Execution requires **Execute mode**. This artifact is the plan only.

## Goal
Sections keep **both top and bottom margins by default**. Authors optionally toggle off top and/or bottom spacing per section, using EDS's model-driven style options (the UE equivalent of AEM's style system).

## Confirmed Requirements
- **Default = both margins enabled** (`margin: var(--spacing-xl) 0` stays). ✅
- **No automatic first/last logic.** ✅
- Spacing controlled purely by **author style toggles**. ✅

## Design — Section Style Toggles
`style` is a **multiselect**, so toggles combine on one section. Add:
- **`No Top Spacing`** (`no-top-spacing`) → `margin-top: 0;`
- **`No Bottom Spacing`** (`no-bottom-spacing`) → `margin-bottom: 0;`
- *(optional)* **`No Spacing`** (`no-spacing`) → both 0.

Toggles affect **margin only**, not inner content padding.

### CSS to add (`styles/styles.css`)
```css
main > .section.no-top-spacing { margin-top: 0; }
main > .section.no-bottom-spacing { margin-bottom: 0; }
main > .section.no-spacing { margin-top: 0; margin-bottom: 0; }
```

### Model options to add (`models/_section.json` → style options)
```json
{ "name": "No Top Spacing", "value": "no-top-spacing" },
{ "name": "No Bottom Spacing", "value": "no-bottom-spacing" },
{ "name": "No Spacing", "value": "no-spacing" }
```

## Open Decision
- Include the convenience **`No Spacing`** (both-off) option, or keep just the two independent toggles? (Plan includes it; easy to drop.)

## Risks / Notes
- **Specificity/order:** `main > .section.<toggle>` matches the base rule's specificity and, declared later, overrides it. Verify it cooperates with `:first-of-type` (already `margin-top:0`) and the `highlight`/`arc-background` rules (which set their own margins) when combined.
- **Padding untouched:** inner `> div` and section-background padding are unaffected by these toggles.
- **UE surfacing:** the new options appear in the section's properties (Style multiselect); no canvas brush icon, but same outcome.

## Checklist

### Phase 1 — Implement
- [ ] Add `No Top Spacing`, `No Bottom Spacing` (and optional `No Spacing`) to `models/_section.json` style multiselect
- [ ] Add `main > .section.no-top-spacing / .no-bottom-spacing / .no-spacing` margin rules to `styles/styles.css`
- [ ] Leave default `margin: var(--spacing-xl) 0` and first-section rule unchanged

### Phase 2 — Validate
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (CSS + JS) passes; validate UE model schema
- [ ] Confirm toggles remove top/bottom margin and combine via multiselect

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) In UE, select the spacing toggle(s) on sections needing reduced spacing

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3.
