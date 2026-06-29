Let me review the current section styling and the section model to ground the recommendation.Let me confirm the user's preference on how authors should control this, since there are a few valid mechanisms with different tradeoffs.# Section Spacing Control — Auto First/Last + Author Toggles

## Goal
Give sections sensible **default vertical spacing** (kept, since it's needed most of the time) while letting authors switch it off for the occasional exception — plus automatic handling for the common first/last cases.

> Execution requires **Execute mode**. This artifact is the plan only.

## Current Behavior (verified)
- `main > .section { margin: var(--spacing-xl) 0; }` — default top+bottom margin on every section.
- `main > .section:first-of-type { margin-top: 0; padding-top: var(--spacing-xl); }` — first section already has no top margin (but top padding).
- `models/_section.json` style options today: `Highlight`, `Arc Background`.

## Confirmed Decisions
- **Approach: Both — auto + toggles.** ✅
- **First-section default: keep current** (no top margin, top padding xl). ✅

## Design

### 1. Automatic (CSS, no authoring effort)
- **First section:** keep current default (unchanged) — no top margin, top padding xl.
- **Last section:** ensure the bottom margin is preserved (the user explicitly wants the last block to keep its bottom spacing). The existing default already gives bottom margin to every section, so the last section is fine — no rule needed unless a later style strips it. Add an explicit guard only if a future style would remove it.
- Net: defaults already satisfy "first no top / last keeps bottom"; auto layer = confirm + document, no behavioral change beyond what exists.

### 2. Author Toggles (Section Style options)
Add multiselect style options to `models/_section.json`, implemented in `styles/styles.css`. Because `style` is a **multiselect**, multiple can combine on one section:
- **`No Top Spacing`** (`no-top-spacing`) → `margin-top: 0; padding-top: 0;`
- **`No Bottom Spacing`** (`no-bottom-spacing`) → `margin-bottom: 0; padding-bottom: 0;`
- **`No Spacing`** (`no-spacing`) → both top and bottom zeroed (convenience for the full-flush case).

These let authors handle the "sometimes" middle-section cases and override the first/last defaults when a specific page needs it.

### CSS to add (to `styles/styles.css`)
```css
main > .section.no-top-spacing {
  margin-top: 0;
  padding-top: 0;
}

main > .section.no-bottom-spacing {
  margin-bottom: 0;
  padding-bottom: 0;
}

main > .section.no-spacing {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
```

### Model options to add (`models/_section.json` → style options)
```json
{ "name": "No Top Spacing", "value": "no-top-spacing" },
{ "name": "No Bottom Spacing", "value": "no-bottom-spacing" },
{ "name": "No Spacing", "value": "no-spacing" }
```

## Risks / Notes
- **Specificity:** toggle rules use `main > .section.<toggle>` to match the base `main > .section` specificity and reliably override; verify they win over `:first-of-type`/`:last-of-type` and the `highlight`/`arc-background` rules (which set their own margins). If an author combines, e.g., `arc-background` + `no-bottom-spacing`, confirm the intended one wins (may need ordering/explicit handling).
- **Multiselect interaction:** `no-spacing` overlaps the two single toggles; harmless but documented so authors pick one.
- **First-section override:** an author applying `no-top-spacing` to the first section is redundant (already no top margin) but now also removes the top padding — which is the desired flush option when wanted.
- **Arc/Highlight sections** define their own padding; toggles should still be able to zero them — verify after implementing.

## Checklist

### Phase 1 — Implement
- [ ] Add `No Top Spacing`, `No Bottom Spacing`, `No Spacing` options to `models/_section.json` style multiselect
- [ ] Add corresponding `main > .section.no-top-spacing / .no-bottom-spacing / .no-spacing` rules to `styles/styles.css`
- [ ] Keep first-section default unchanged; confirm last-section bottom spacing is retained

### Phase 2 — Validate
- [ ] Rebuild merged `component-definition/models/filters.json`
- [ ] `npm run lint` (CSS + JS) passes; validate UE model schema
- [ ] Verify toggles override defaults, `:first-of-type`, `highlight`, and `arc-background` correctly

### Phase 3 — Ship
- [ ] Commit and push to `origin/main`
- [ ] (Author-side) In UE, apply the toggle(s) on sections needing non-default spacing

### Execution Note
- [ ] Switch to **Execute mode** to implement Phases 1–3.
