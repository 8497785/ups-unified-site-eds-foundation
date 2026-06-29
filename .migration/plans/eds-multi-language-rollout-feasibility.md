# EDS Multi-Language (MSM Language-Masters + Rollout) — Feasibility & Path/Link Plan

## Question
Your current AEM site is **MSM with multiple languages**: authors work under `/content/[project]/language-masters/en`, then create **language copies** and **roll out** to other locales. You want the same model here in EDS — and this also affects why the leadership card links currently use a hardcoded `/us/en/...` prefix.

## Short Answer
**Yes — this is possible.** MSM (language-masters + language copies + rollout) is an **AEM-author capability**, and it works *with* EDS because EDS simply delivers whatever JCR pages get published. The two layers are independent:
- **Authoring/translation (AEM author):** language-masters, MSM blueprints/live copies, rollout — all handled in AEM exactly as you do today.
- **Delivery (EDS):** each published page is served at a clean URL via `paths.json`/`fstab.yaml` mappings.

The key change for *this* project is that links must be **locale-aware / derived from the current path**, not hardcoded — which is exactly the bug behind the `/us/en/...` card links.

## Why the Card Link Is Wrong Today
- The block hardcodes `/us/en/our-company/leadership/<slug>.html` (copied from the source UPS site).
- Your `paths.json` maps `/content/about-ups-eds/us/en/ → /`, so the real published URL is `/our-company/leadership.html` — no `/us/en/`.
- In an MSM/multi-locale setup the prefix will differ per locale, so a hardcoded prefix can never be correct across locales.

## How EDS Handles This Structure
- **Content tree:** author under `/content/<project>/language-masters/en/...`; MSM live copies create `/content/<project>/<region>/<lang>/...` (or your locale convention).
- **`fstab.yaml` + `paths.json`:** map each locale's content root to its delivery URL base (e.g. `…/us/en/ → /` or `…/<region>/<lang>/ → /<region>/<lang>/`). One mapping set per site/locale as needed.
- **Blocks must be locale-relative:** instead of a hardcoded prefix, derive links from the **current page's clean path** (or strip the known content root), so a card on the `en` page links to `en` bios and a rolled-out `fr` page links to `fr` bios automatically.

## Decisions Needed (to finalize both MSM approach and the link fix)
1. **Locale URL scheme:** do published locale URLs keep a prefix (e.g. `/us/en/...`) or map each locale root to `/` on separate sites? This determines `paths.json` and link derivation.
2. **Link base for the leadership cards now:** clean `/our-company/leadership/<slug>.html` vs. keep `/us/en/...` vs. **derive dynamically** from the current page path (most robust for MSM).
3. **Scope of this change:** just fix the card link for the current locale, or make the block fully locale-aware for future rollouts.

> These need your input before I touch code — I don't want to hardcode another wrong prefix.

## Proposed Link Fix (pending decision)
- **Recommended (MSM-safe):** derive the bio base from the **current `window.location.pathname`** — e.g. take the leadership listing page's own directory and append `/<slug>.html`. That way it's automatically correct for `en` and every rolled-out locale, with no hardcoded `/us/en/` or `/our-company/` assumptions.
- **Simpler (single-locale):** hardcode the clean base `/our-company/leadership/<slug>.html` to match `paths.json` now; revisit when locales are added.

## Checklist

### Phase 0 — Decisions (blocking)
- [ ] Confirm locale URL scheme (prefix per locale vs. per-site root mapping)
- [ ] Choose card-link strategy: dynamic-from-current-path (recommended) vs. clean hardcoded vs. keep `/us/en/`
- [ ] Confirm whether to make the block locale-aware now or later

### Phase 1 — Fix Leadership Card Links (Execute mode)
- [ ] Update `deriveBioLink` in `leadership-listing.js` per the chosen strategy (remove hardcoded `/us/en/`)
- [ ] If dynamic: derive base from current page path so it works across locales
- [ ] Apply the same fix to `leadership-list-cf` if it should match (confirm)

### Phase 2 — MSM / Multi-Language Enablement (AEM author + config)
- [ ] Define content structure: `/content/<project>/language-masters/en` as master
- [ ] Set up MSM blueprint/live-copy + rollout config in AEM author (author-side task)
- [ ] Add/adjust `fstab.yaml` + `paths.json` mappings per locale
- [ ] Verify a rolled-out locale page resolves and its blocks link within that locale

### Phase 3 — Validate
- [ ] Lint + schema validate any code changes
- [ ] Confirm card links resolve to existing pages for the current locale
- [ ] (Author-side) Roll out to a test locale and verify links/breadcrumb adapt
- [ ] Leave uncommitted per your workflow (you commit manually)

### Execution Note
- [ ] MSM authoring/rollout itself is configured in **AEM author** (outside this repo). In this repo I can: fix the block's link derivation to be locale-safe, and adjust `paths.json`/`fstab.yaml` mappings. Switch to **Execute mode** once you confirm the locale URL scheme and link strategy.
