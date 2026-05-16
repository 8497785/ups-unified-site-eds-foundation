# AEM Language Masters Page Structure & MSM Rollout Plan

## Overview

**Objective:** Create the Language Masters blueprint page structure in the AEM authoring environment at `author-p55671-e392471.adobeaemcloud.com` using the Admin API, then configure MSM live copy rollout to `/us/en/`.

**Author Instance:** `https://author-p55671-e392471.adobeaemcloud.com`
**Site Path:** `/content/about-ups-eds`
**Authentication:** Bearer token (to be provided at execution time)

---

## Content Structure

### Blueprint (Language Masters)
```
/content/about-ups-eds/
├── language-masters/                    ← Language Masters root
│   └── us/                              ← Region
│       └── en/                          ← Language root (Blueprint)
│           ├── home                     ← Homepage
│           ├── nav                      ← Navigation fragment
│           └── footer                   ← Footer fragment
```

### Live Copy (EDS Delivery)
```
/content/about-ups-eds/
├── us/                                  ← Live Copy region
│   └── en/                              ← Live Copy language root
│       ├── home                         ← Rolled out from blueprint
│       ├── nav                          ← Rolled out from blueprint
│       └── footer                       ← Rolled out from blueprint
```

### EDS Path Mapping (paths.json)
```
/content/about-ups-eds/us/en/home → /us/en/home (served by EDS)
/content/about-ups-eds/us/en/nav  → /us/en/nav  (nav fragment)
/content/about-ups-eds/us/en/footer → /us/en/footer (footer fragment)
```

---

## API Approach

All operations use the **AEM Assets/Sites HTTP API** with `curl` commands against the author instance. Each page is created as a `cq:Page` node with appropriate `jcr:content` child containing the page properties.

### API Endpoints Used

| Operation | Method | Endpoint |
|---|---|---|
| Create page | POST | `/api/assets/{path}/*` or Sling POST to `/content/...` |
| Set page properties | POST | `/content/{path}/jcr:content` |
| Create Live Copy | POST | `/libs/wcm/msm/content/commands/createLiveCopy` |
| Rollout | POST | `/libs/wcm/msm/content/commands/rollout` |
| Verify page exists | GET | `/content/{path}.json` |

---

## Checklist

### Phase 1: Create Language Masters Blueprint Structure
- [ ] **1.1** Validate access token by checking AEM author connectivity
- [ ] **1.2** Create `/content/about-ups-eds/language-masters` page (Language Masters root)
- [ ] **1.3** Create `/content/about-ups-eds/language-masters/us` page (US region)
- [ ] **1.4** Create `/content/about-ups-eds/language-masters/us/en` page (English language root — blueprint source)
- [ ] **1.5** Verify all three pages exist via GET requests

### Phase 2: Create Content Pages Under Blueprint
- [ ] **2.1** Create `/content/about-ups-eds/language-masters/us/en/home` page (Homepage)
- [ ] **2.2** Create `/content/about-ups-eds/language-masters/us/en/nav` page (Navigation fragment)
- [ ] **2.3** Create `/content/about-ups-eds/language-masters/us/en/footer` page (Footer fragment)
- [ ] **2.4** Verify all content pages exist

### Phase 3: Configure Blueprint
- [ ] **3.1** Set blueprint configuration on `/content/about-ups-eds/language-masters/us/en` (mark as blueprint source)
- [ ] **3.2** Verify blueprint configuration via GET

### Phase 4: Create Live Copy
- [ ] **4.1** Create live copy at `/content/about-ups-eds/us/en` from blueprint `/content/about-ups-eds/language-masters/us/en`
- [ ] **4.2** Configure rollout config as `standard` (rollout on modification)
- [ ] **4.3** Verify live copy relationship exists

### Phase 5: Initial Rollout
- [ ] **5.1** Trigger rollout from blueprint to live copy (deep — include all sub-pages)
- [ ] **5.2** Verify `/content/about-ups-eds/us/en/home` exists (rolled out)
- [ ] **5.3** Verify `/content/about-ups-eds/us/en/nav` exists (rolled out)
- [ ] **5.4** Verify `/content/about-ups-eds/us/en/footer` exists (rolled out)

### Phase 6: Verify EDS Delivery
- [ ] **6.1** Check that EDS serves content from the live copy path
- [ ] **6.2** Verify header loads nav fragment from `/us/en/nav`
- [ ] **6.3** Verify footer loads from `/us/en/footer`

---

## Execution Details

### Phase 1: API Calls for Blueprint Structure

```bash
# 1.1 — Test connectivity
AEM_HOST="https://author-p55671-e392471.adobeaemcloud.com"
AEM_TOKEN="<token-to-be-provided>"

curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST/content/about-ups-eds.json"

# 1.2 — Create language-masters root
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=Language Masters" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters"

# 1.3 — Create US region
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=US" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us"

# 1.4 — Create English language root
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=English" \
  -F "jcr:content/jcr:language=en" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en"
```

### Phase 2: Content Pages

```bash
# 2.1 — Create homepage
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=Home" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en/home"

# 2.2 — Create nav fragment
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=Navigation" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en/nav"

# 2.3 — Create footer fragment
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:primaryType=cq:Page" \
  -F "jcr:content/jcr:primaryType=cq:PageContent" \
  -F "jcr:content/jcr:title=Footer" \
  -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en/footer"
```

### Phase 3: Blueprint Configuration

```bash
# 3.1 — Set blueprint config on language root
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:content/cq:isBlueprint=true" \
  -F "jcr:content/cq:isBlueprint@TypeHint=Boolean" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en"
```

### Phase 4: Create Live Copy

```bash
# 4.1 — Create live copy
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "cmd=createLiveCopy" \
  -F "srcPath=/content/about-ups-eds/language-masters/us/en" \
  -F "destPath=/content/about-ups-eds/us/en" \
  -F "title=English (US)" \
  -F "label=en" \
  -F "rolloutConfigs=/libs/msm/wcm/rolloutconfigs/default" \
  -F "deep=true" \
  "$AEM_HOST/libs/wcm/msm/content/commands/createLiveCopy"
```

### Phase 5: Initial Rollout

```bash
# 5.1 — Trigger deep rollout
curl -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "cmd=rollout" \
  -F "path=/content/about-ups-eds/language-masters/us/en" \
  -F "deep=true" \
  "$AEM_HOST/libs/wcm/msm/content/commands/rollout"
```

---

## Verification Queries

```bash
# Check blueprint pages exist
curl -s -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST/content/about-ups-eds/language-masters/us/en.json" | python3 -m json.tool

# Check live copy pages exist after rollout
curl -s -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST/content/about-ups-eds/us/en.json" | python3 -m json.tool

# Check live copy relationship
curl -s -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST/content/about-ups-eds/us/en/jcr:content.json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('Live copy source:', data.get('cq:master', 'NOT SET'))
print('Rollout config:', data.get('cq:rolloutConfigs', 'NOT SET'))
"
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Token expired during execution | API calls fail with 401 | Validate token first in step 1.1; re-prompt if expired |
| Page already exists at path | POST returns 500 | Check existence with GET before creating; skip if exists |
| Live copy path already in use | MSM relationship conflict | Verify `/content/about-ups-eds/us/en` doesn't already exist; delete or reuse if it does |
| Rollout config not found | Live copy creation fails | Use standard config path `/libs/msm/wcm/rolloutconfigs/default` |
| XWalk page template mismatch | Pages don't render in Universal Editor | Use `core/franklin/components/page/v1/page` resource type matching the XWalk boilerplate |

---

## Prerequisites Before Execution

1. **Bearer token** — user will provide at execution time
2. **Site root exists** — `/content/about-ups-eds` must already exist (confirmed from `fstab.yaml` and `project.json`)
3. **Code already committed** — header/footer JS with locale-aware fragment loading (done in previous commits)

---

*To execute this plan, switch to Execute mode and provide the AEM Bearer token when prompted.*
