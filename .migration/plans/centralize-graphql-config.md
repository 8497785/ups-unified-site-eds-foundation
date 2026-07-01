Let me verify the project segment and how the blocks currently import config, since those determine whether this new config will work.Looking at your proposed `config.js` against how the blocks actually call GraphQL today, three things would break or need attention:

**1. `encodeURIComponent` in `buildQueryParams` — this is the critical one.** You already hit and diagnosed this: encoding the semicolon params produces `409 "Variable 'tag' has coerced Null value"`. The persisted query parses the literal path/tag, so the slashes and colons must stay raw. Both current blocks deliberately emit unencoded params. If the new config encodes them, every listing/detail query regresses.

**2. Project-name mismatch.** The proposal hardcodes `GRAPHQL_ENDPOINT = '/graphql/execute.json/upsstories'`, but the working queries both use `ups-global`:
- listing → `/graphql/execute.json/ups-global/leadership-list;rootPath=…;tag=…`
- details → `/graphql/execute.json/ups-global/leadership-details;path=…`

`upsstories` would 404 unless that project actually exists on your publish tier.

**3. Adopting `getGraphQLUrl()` requires touching both blocks.** Right now they import `AEM_GRAPHQL_HOST` and each has its own `buildQueryUrl` (with different param shapes — `rootPath;tag` vs `path`). The proposed export shape (`GRAPHQL` object + `getGraphQLUrl()`) means I'd have to rewrite both blocks to call the helper and delete their local builders and `DEFAULT_PROJECT`/`DEFAULT_QUERY` constants. That's fine, but it's a wider change than just swapping the config file.

**What's good:** the `.aem.page`/`.aem.live`-only host resolution is preserved — that logic is correct and matches what we want (absolute host only on delivery tiers, relative everywhere else).

My recommendation: keep the current minimal `config.js` (just `AEM_GRAPHQL_HOST`) and let each block keep its own raw-param builder, since the two queries have genuinely different param shapes. If you'd rather centralize into `getGraphQLUrl()`, I can do that — but it must (a) drop the `encodeURIComponent`, and (b) use `ups-global`, not `upsstories`.

Which direction do you want?Both answered — centralize with `getGraphQLUrl()`, using `ups-global`, raw params. Let me write the config and update both blocks.I'm in plan mode, so I can't write yet. Let me load the plan-mode exit tool and present the change plan.Here's my implementation plan for centralizing the GraphQL config:

## Plan: Centralize GraphQL URL building

**1. `scripts/config.js`** — replace with a helper-based export:
- Keep `AEM_GRAPHQL_HOST` (delivery-tier-only absolute host — unchanged logic).
- Add `GRAPHQL_PROJECT = 'ups-global'` constant.
- Add `getGraphQLUrl(queryName, params = {})` that builds `{host}/graphql/execute.json/ups-global/{queryName}` and appends **raw** `;key=value` segments (no `encodeURIComponent` — skips empty values). Drop the `import/prefer-default-export` disable since there are now multiple named exports.

**2. `blocks/leadership-listing/leadership-listing.js`**:
- Import `getGraphQLUrl` instead of `AEM_GRAPHQL_HOST`.
- Remove local `buildQueryUrl`, `DEFAULT_PROJECT`, and the `AEM_GRAPHQL_HOST` import. Keep `DEFAULT_QUERY = 'leadership-list'` and `normalizeRootPath`.
- Call `getGraphQLUrl('leadership-list', { rootPath: cleanRoot, tag: tags.join('/') })`.

**3. `blocks/leadership-details/leadership-details.js`**:
- Import `getGraphQLUrl` instead of `AEM_GRAPHQL_HOST`.
- Remove local `buildQueryUrl` and `DEFAULT_PROJECT`. Keep `DEFAULT_QUERY = 'leadership-details'`.
- Call `getGraphQLUrl('leadership-details', { path: cfPath })`.

**4. Verify** with `npm run lint:js` to confirm no eslint regressions.

No commit — I'll leave everything uncommitted for you to review and commit manually.Not in plan mode anymore — proceeding with implementation.There's a state mismatch. Let me try exiting plan mode again.There's a conflicting state between tools. Let me test with a simple bash command.Bash works. Let me retry the Write.Write is blocked but Bash executes. Let me confirm Bash can write files.Tooling is in a conflicted state (Write blocked, but Bash executes and the file is writable). Let me try the Edit tool instead.The tooling is in a contradictory state: the file-writing tools (Write/Edit) report that plan mode is active and block execution, while `ExitPlanMode` insists I'm *not* in plan mode. I don't want to route around that by writing files through Bash, since it would bypass whatever approval gate is intended.

Could you toggle out of plan mode (into execute/accept-edits mode) so the edits can go through? Once you do, I'll apply the three changes exactly as planned:

1. **`scripts/config.js`** — add `getGraphQLUrl(queryName, params)` with raw `;key=value` params and `ups-global` project (host logic unchanged).
2. **`leadership-listing.js`** — swap to `getGraphQLUrl('leadership-list', { rootPath, tag })`, drop the local builder.
3. **`leadership-details.js`** — swap to `getGraphQLUrl('leadership-details', { path })`, drop the local builder.

Then I'll run `npm run lint:js` to confirm no regressions. Nothing will be committed.
