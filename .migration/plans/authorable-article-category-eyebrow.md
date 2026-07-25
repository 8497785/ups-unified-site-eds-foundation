# Make Article Eyebrow (Category) Title & Link Authorable — as AEM Content Path

## Your question answered: correct — the path-building helper is migration-only, not in the block

You're right. The two concerns are separate:

- **Migration generator** — needs a small helper to *build* the content path (`/content/about-ups-eds/<parent>`) once, so each migrated page ships with a valid authored `eyebrowLink` reference. **Helper lives here only.**
- **The block** — the `eyebrowLink` field stays an **`aem-content` content-picker** field. Authors select the target page via the picker; the block just **reads the authored reference and renders it**. It does **not** build any path, so no path-building helper belongs in the block.

So: **no path-building helper in the block.** ✓

The one thing still worth checking at execution (and it's *not* a path-building helper) is purely how the authored `aem-content` value arrives in the delivered DOM — i.e. does the EDS pipeline already render it as a clean served URL, or as the raw `/content/about-ups-eds/...` path? If it's already clean, the block does nothing but render the href. If it's raw, the block needs a tiny one-line strip of the `/content/about-ups-eds` prefix. That's a rendering-format detail, decided by verification, not a helper the author interacts with.

> Implementation requires **Execute mode** — this plan captures the finalized design.

## Design (updated per your clarification)

### Part A — Generator (migration only): emit authored eyebrow + content-path link
- On the `article-header` block node emit:
  - `eyebrow="<source label>"` (e.g. "Customer First", from `byField.eyebrow`).
  - `eyebrowLink="/content/about-ups-eds/<parent category path>"` (e.g. `/content/about-ups-eds/language-masters/en/newsroom/press-releases/customer-first`) — a valid `aem-content` reference so MSM rewrites it on rollout.
- The **content-path helper is here, in the generator only** (prefix `categoryUrl(relPath)` with `/content/about-ups-eds`).
- Page metadata (`categorytitle`, `categoryurl`) unchanged.

### Part B — Block: render the authored content-picker value (no path-building)
- `eyebrowLink` remains an **`aem-content`** field (unchanged) → authors pick content via the picker.
- Remove the dynamic chain: `getMetadata` import, `parentCategoryPath()`, `humanize()`, `categoryTitleFromIndex()`, async fallback.
- Eyebrow title = authored `eyebrow` cell only.
- Eyebrow link = the authored `eyebrowLink` href, **rendered as delivered**. Only if execution-time verification shows the delivered value is the raw `/content/about-ups-eds/...` path, add a minimal prefix-strip (idempotent) — otherwise render as-is. No author-facing helper either way.
- `decorate` becomes synchronous. Title, byline (date + read time), description unchanged.

### Part C — Regenerate + verify
- Re-run generator → all 39 pages carry authored `eyebrow` + content-path `eyebrowLink`.
- Verify a sample `.content.xml`.
- Rebuild the combined package (articles + listing) and refresh served `content/about-ups-eds.zip`.

## Current State (verified)
- `article-header.js`: dynamic eyebrow fallback present (query-index → metadata → humanize; link → parentCategoryPath). To be removed.
- `generate-article-jcr.mjs`: parses `byField.eyebrow`; computes `categoryUrl(relPath)`; does **not** currently emit `eyebrow`/`eyebrowLink` on the block node. `modelFields` already lists `[eyebrow,eyebrowLink,...]`.
- `eyebrowLink` field is `aem-content` — correct picker type for a content reference + MSM rewrite.

## Risks / Notes
- **Rollout rewrite:** authored `/content/about-ups-eds/language-masters/en/...` → MSM rewrites to `/content/about-ups-eds/us/en/...` on rollout, *if* the rollout config includes reference update (Standard config does). Confirm on first rollout.
- **Requires re-upload** so pages carry the authored eyebrow/link; then authors can re-pick per page in UE.
- **Delivery rendering of `aem-content`** links is the one execution-time check (clean vs raw path) — determines whether the block needs the one-line strip. Kept idempotent/minimal; no impact on authoring.
- Verified-locally caveat: JCR + block logic verifiable locally; MSM rewrite + live render need spot-check in AEM after re-upload + rollout.

## Checklist

- [ ] `generate-article-jcr.mjs`: add content-path helper (prefix `categoryUrl(relPath)` with `/content/about-ups-eds`); emit `eyebrow` + `eyebrowLink` (full content reference) on the article-header block node — **Execute mode**
- [ ] Keep `eyebrowLink` as an `aem-content` (content-picker) field — no model change; no path-building helper in the block
- [ ] `article-header.js`: remove query-index lookup, `parentCategoryPath`, `humanize`, `getMetadata` import, async fallback
- [ ] `article-header.js`: render eyebrow title + authored `eyebrowLink` href; make `decorate` synchronous
- [ ] Execution check: confirm whether EDS delivery renders the `aem-content` value as a clean served URL or raw `/content/about-ups-eds/...`; only add a minimal idempotent prefix-strip if raw
- [ ] Keep title, byline (date + read time), description unchanged
- [ ] Lint `article-header.js`
- [ ] Regenerate package; verify a sample article `.content.xml` has `eyebrow` + full-content-path `eyebrowLink`
- [ ] Verify in preview: eyebrow shows the label and links to a working served path
- [ ] Rebuild combined package (articles + listing) and refresh served `content/about-ups-eds.zip`
- [ ] Commit & push (`article-header.js`, `generate-article-jcr.mjs`); provide refreshed package for re-upload
- [ ] On first MSM rollout, confirm the `eyebrowLink` reference rewrites language-masters → us/en
