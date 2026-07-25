# Read Article Metadata From the Block, Not Head Meta / Page Model

## Goal
Stop relying on page-property meta tags for `published` / `category` / `categoryUrl` in the query index. Read those values from the **article-header block cells** in the server-rendered HTML instead, so a page authored normally (block only, e.g. `test-article`) populates the index without any extra page-property step. Keep `title` / `description` / `image` coming from head meta tags.

## Why this works
The query crawler indexes the **undecorated** server HTML — it does NOT run block JS. The article-header block cells are positional divs. Confirmed against both the migrated `ups-brown-friday.plain.html` and the manually-authored `test-article` markup you just shared:

```
.article-header > div:nth-child(1)      -> "Customer First"        (category label)
.article-header > div:nth-child(2) a    -> <a href="…">            (category URL = href)
.article-header > div:nth-child(3)      -> "Test Article"          (title)
.article-header > div:nth-child(4)      -> description
.article-header > div:nth-child(5)      -> "2026-07-20T00:00:…Z"   (published / article date)
.article-header > div:nth-child(6)      -> (hideReadTime)
```

The structure is identical whether or not `<!-- field:x -->` comments are present, so positional `nth-child` selectors resolve in both migrated and authored pages.

## Date-format note
In the raw HTML the date cell renders as an ISO timestamp (`2026-07-20T00:00:00.000Z`) — the MM-DD-YYYY formatting only happens in block JS, which the crawler doesn't run. So `published` in the index will be the raw ISO string. That is a valid, sortable date value; listing/related blocks that consume `published` should parse ISO (they already format for display). No extra change needed for indexing, but flagging it.

## Changes

### 1. Revert page-metadata model additions — `models/_page.json`
Remove `publishdate`, `categorytitle`, `categoryurl`; leave only `jcr:title`, `jcr:description`, `keywords`. Then run `npm run build:json` to regenerate the merged component JSON (component-definition / component-models / component-filters).

### 2. Repoint selectors — `helix-query.yaml`
In the `pages` and `press-releases` indices, change three properties (keep everything else as-is):

- `published`   → `select: main .article-header > div:nth-child(5)` · `value: textContent(el)`
- `category`    → `select: main .article-header > div:nth-child(1)` · `value: textContent(el)`
- `categoryUrl` → `select: main .article-header > div:nth-child(2) a` · `value: attribute(el, "href")`

Keep `title` (og:title), `description` (name=description), `image` (og:image) on head meta.

## Checklist
- [ ] Revert `models/_page.json` — remove `publishdate` / `categorytitle` / `categoryurl` fields
- [ ] Run `npm run build:json` to regenerate merged component JSON
- [ ] Edit `helix-query.yaml` `pages` index: repoint `published` / `category` / `categoryUrl` to block cells
- [ ] Edit `helix-query.yaml` `press-releases` index: same three selectors
- [ ] Verify `title` / `description` / `image` still read from head meta (unchanged)
- [ ] Sanity-check selectors against `test-article` and `ups-brown-friday` rendered HTML in preview
- [ ] Report back; note that (re)publish of pages + query-index is required to refresh values (no auto-commit)

> Note: executing these file edits and the build command requires **Execute mode** — I'm currently in plan mode and can't write files yet.
