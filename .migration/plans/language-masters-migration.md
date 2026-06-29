Let me check the current project config to ground the migration plan before asking.There's already an MSM setup script in the project that establishes a blueprint + live-copy + rollout structure. Your target structure naming differs slightly from it, and the migration approach depends on a few choices, so let me confirm before finalizing.# Migrate to MSM Language-Masters (language-masters/en) + Locale-Aware Links

## Goal
Restructure the About-UPS-EDS content to the **MSM language-masters model** — author under `/content/about-ups-eds/language-masters/en`, then create **live copies / rollouts** to locale paths (e.g. `/content/about-ups-eds/us/en`) — migrating the **existing** content at `/content/about-ups-eds/us/en` into the new blueprint. Also make the leadership block links **locale-aware** and update `paths.json`/`fstab.yaml` to match.

> MSM blueprint/live-copy/rollout runs in **AEM author** (outside this repo). In-repo I'll adapt the MSM script, fix block links, and update path mappings. Execution requires **Execute mode**; per your workflow I will **not commit** (you commit manually).

## Confirmed Decisions
- **Blueprint (master) path:** `/content/about-ups-eds/language-masters/en` (language-only master). ✅
- **Migration:** copy the existing `us/en` content **into** the language-masters blueprint, then (re)create the **live copy** at `us/en` that EDS serves. ✅
- **Work scope:** adapt the repo MSM script **and** fix leadership block links to be locale-aware **and** update `paths.json`/`fstab.yaml`. ✅

## Target Structure
```
/content/about-ups-eds/
  language-masters/
    en/                     ← blueprint (author here): home, nav, footer, our-company/leadership, bios…
  us/
    en/                     ← live copy (EDS serves): rolled out from language-masters/en
```
- **Authoring/translation:** in `language-masters/en` (+ future language copies `language-masters/fr`, etc.).
- **Delivery:** locale live copies (`us/en`, …) served by EDS via `paths.json`.

## Path / URL Mapping (paths.json + fstab.yaml)
- Decision point baked in: keep serving the live copy `us/en` at clean root, OR introduce locale-prefixed URLs.
- **Plan:** keep current behavior — `/content/about-ups-eds/us/en/ → /` (so `/our-company/leadership.html`). Document how to add more locales later (e.g. `…/fr/fr/ → /fr/` or a second site).
- `fstab.yaml` mountpoint stays the same project; mappings live in `paths.json`.

## Leadership Link Fix (locale-aware) — root cause
- Block currently hardcodes `/us/en/our-company/leadership/<slug>.html` → wrong for clean URLs and for any non-`us/en` locale.
- **Fix:** derive the bio link from the **current page's clean path** at runtime, so a card on `/our-company/leadership` links to `/our-company/leadership/<slug>.html`, and a rolled-out locale page links within that locale automatically — no hardcoded prefix.
- Apply to **both** `leadership-listing` and `leadership-list-cf` (confirm parity).

## MSM Script Changes (`tools/msm/setup-language-masters.sh`)
- Change blueprint root from `language-masters/us/en` → **`language-masters/en`**.
- Add a **content-copy step**: copy existing `/content/about-ups-eds/us/en/*` into `language-masters/en` as the blueprint source (before setting blueprint + creating live copy).
- Recreate **live copy** `us/en` from `language-masters/en` (`label=en`), then **deep rollout**.
- Keep token-based auth + idempotent guards already in the script.

## Risks / Constraints
- **MSM ops require AEM author + token** — I can't run them from this sandbox (auth/TLS limits). I prepare the script; **you run it** against author.
- **Copying live content into a blueprint** can create conflicts if `us/en` later becomes a live copy of itself — the script must copy first, then convert `us/en` into a fresh live copy (handle the "already exists" path carefully to avoid data loss). **Back up `us/en` before running.**
- **Locale URL scheme for future locales** still open; this plan locks only `en` master → `us/en` live copy = clean root.
- **Link derivation** assumes bios live as siblings under the leadership page's directory; confirm that holds in the live-copy tree.
- **No commit** — all repo edits left in working tree.

## Checklist

### Phase 1 — Repo: Locale-Aware Links
- [ ] Update `deriveBioLink` in `leadership-listing.js` to derive base from current page path (drop hardcoded `/us/en/`)
- [ ] Apply matching fix in `leadership-list-cf.js` (confirm parity)
- [ ] Lint; leave uncommitted

### Phase 2 — Repo: Path Mapping
- [ ] Confirm/adjust `paths.json` so `language-masters/en` is excluded from delivery and `us/en` maps to `/`
- [ ] Document multi-locale extension pattern (comment/notes); leave `fstab.yaml` mountpoint unchanged
- [ ] Leave uncommitted

### Phase 3 — Repo: MSM Script
- [ ] Rewrite `tools/msm/setup-language-masters.sh`: blueprint `language-masters/en`, copy existing `us/en` content in, set blueprint, create live copy `us/en`, deep rollout
- [ ] Add safety: back-up note + idempotent checks; copy-before-convert ordering
- [ ] Leave uncommitted

### Phase 4 — Author-Side (you run)
- [ ] Back up `/content/about-ups-eds/us/en`
- [ ] Run the script with `AEM_TOKEN` against author
- [ ] Verify blueprint, live copy, and rollout in Sites Console
- [ ] Confirm EDS serves the live copy and leadership card links resolve

### Execution Note
- [ ] Switch to **Execute mode** for Phases 1–3 (repo edits, uncommitted). Phase 4 is author-side and run by you with a token. Open item: confirm bios live as siblings under the leadership page so dynamic link derivation is correct.
