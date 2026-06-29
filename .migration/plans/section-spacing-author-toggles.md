# Section Spacing Control — Author Toggles

## Goal
Sections keep **both top and bottom margins by default**. Authors can optionally **toggle off** the top and/or bottom spacing per section when needed.

> Execution requires **Execute mode**. This artifact is the plan only.

## Clarified Requirement (this revision)
- **Default = both margins enabled** on every section (the current `margin: var(--spacing-xl) 0` stays).
- **No automatic first/last logic** — drop that. Spacing is controlled purely by author toggles.
- Authors switch off **top** and/or **bottom** spacing via Section Style options where required.

## Current Behavior (verified)
- `main > .section { margin: var(--spacing-xl) 0; }` — default top+bottom margin.
- `main > .section:first-of-type { margin-top: 0; padding-top: var(--spacing-xl); }` — existing first-section rule.
- `models/_section.json` style options today: `Highlight`, `Arc Background`.

## Design — Author Toggles only
`style` is a **multiselect**, so toggles can combine on one section. Add two options (plus an optional convenience "both off"):
- **`No Top Spacing`** (`no-top-spacing`) → `margin-top: 0;`
- **`No Bottom Spacing`** (`no-bottom-spacing`) → `margin-bottom: 0;`
- *(optional)* **`No Spacing`** (`no-spacing`) → both margins 0.

Note: toggles affect **margin only** (matching the default spacing mechanism), not the inner content padding.

### CSS to add (`styles/styles.css`)
```css
main > .section.no-top-spacing {
  margin-top: 0;
}

main > .section.no-bottom-spacing {
  margin-bottom: 0;
}

main > .section.no-spacing {
  margin-top: 0;
  margin-bottom: 0;
}
```

### Model options to add (`models/_section.json` → style options)
```json
{ "name": "No Top Spacing", "value": "no-top-spacing" },
{ "name": "No Bottom Spacing", "value": "no-bottom-spacing" },
{ "name": "No Spacing", "value": "no-spacing" }
```

## Open Decision
- Whether to also include the convenience **`No Spacing`** (both-off) option, or keep just the two independent top/bottom toggles. (Plan includes it; easy to drop.)

## Risks / Notes
- **Specificity:** `main > .section.<toggle>` matches the base rule's specificity; since it's declared later in the file it overrides. Verify it also wins over `:first-of-type` (which sets `margin-top:0` already — compatible) and the `highlight`/`arc-background` rules (which set their own margins — confirm intended result when combined).
- **First section:** keeps the existing default rule; an author can still add `No Top Spacing` redundantly with no ill effect.
- **Padding untouched:** toggles deliberately don't change inner `> div` padding or section background padding.

## Checklist

### Phase 1 — Implement
- [ ] Add `No Top Spacing`, `No Bottom Spacing` (and optional `No Spacing`) to `models/_section.json` style multiselect
- [ ] Add `main > .section.no-top-spacing / .no-bottom-spacing / .no-spacing` margin rules to `styles/styles.css`
- [ ] Leave default `margin: var(--spacing-xl) 0` and first-section rule unchanged

### Phase 2 — Validate
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (CSS + JS) passes; validate UE model schema
- [ ] Confirm toggles correctly remove top/bottom margin and combine via multiselect

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) In UE, apply toggle(s) on sections needing reduced spacing

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3.
