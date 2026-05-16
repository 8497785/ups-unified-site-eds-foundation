#!/bin/bash
#
# AEM Language Masters & MSM Live Copy Setup Script
#
# Creates the Language Masters blueprint structure and configures
# MSM live copy rollout for the About UPS EDS project.
#
# Usage:
#   export AEM_TOKEN="your-bearer-token-here"
#   bash tools/msm/setup-language-masters.sh
#
# Generate a token from: AEM Developer Console > Local Development Access Token

set -euo pipefail

AEM_HOST="${AEM_HOST:-https://author-p55671-e392471.adobeaemcloud.com}"
AEM_TOKEN="${AEM_TOKEN:?ERROR: Set AEM_TOKEN environment variable with your Bearer token}"
SITE_PATH="/content/about-ups-eds"

log() { echo "[$(date '+%H:%M:%S')] $1"; }
fail() { echo "[ERROR] $1" >&2; exit 1; }

check_response() {
  local code="$1"
  local step="$2"
  if [[ "$code" -ge 200 && "$code" -lt 300 ]] || [[ "$code" == "201" ]]; then
    log "  ✅ $step (HTTP $code)"
  elif [[ "$code" == "500" ]] || [[ "$code" == "409" ]]; then
    log "  ⚠️  $step (HTTP $code — page may already exist, continuing)"
  else
    fail "$step failed (HTTP $code)"
  fi
}

page_exists() {
  local path="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $AEM_TOKEN" \
    "$AEM_HOST${path}.json")
  [[ "$code" == "200" ]]
}

create_page() {
  local path="$1"
  local title="$2"
  local extra_args=("${@:3}")

  if page_exists "$path"; then
    log "  ⏭️  $path already exists — skipping"
    return 0
  fi

  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $AEM_TOKEN" \
    -F "jcr:primaryType=cq:Page" \
    -F "jcr:content/jcr:primaryType=cq:PageContent" \
    -F "jcr:content/jcr:title=$title" \
    -F "jcr:content/sling:resourceType=core/franklin/components/page/v1/page" \
    "${extra_args[@]}" \
    "$AEM_HOST$path")
  check_response "$code" "Create $path"
}

# ═══════════════════════════════════════════════════════════
# Phase 1: Validate Access & Create Blueprint Structure
# ═══════════════════════════════════════════════════════════

log "Phase 1: Validating access and creating blueprint structure"
log ""

# 1.1 — Test connectivity
log "1.1 Testing AEM author connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST${SITE_PATH}.json")

if [[ "$HTTP_CODE" != "200" ]]; then
  fail "Cannot access AEM author (HTTP $HTTP_CODE). Check your token and host."
fi
log "  ✅ AEM author accessible (HTTP $HTTP_CODE)"
log ""

# 1.2 — Create language-masters root
log "1.2 Creating Language Masters root..."
create_page "${SITE_PATH}/language-masters" "Language Masters"

# 1.3 — Create US region
log "1.3 Creating US region..."
create_page "${SITE_PATH}/language-masters/us" "US"

# 1.4 — Create English language root
log "1.4 Creating English language root (blueprint source)..."
create_page "${SITE_PATH}/language-masters/us/en" "English" \
  -F "jcr:content/jcr:language=en"

# 1.5 — Verify all structure pages
log ""
log "1.5 Verifying blueprint structure..."
for path in language-masters language-masters/us language-masters/us/en; do
  if page_exists "${SITE_PATH}/$path"; then
    log "  ✅ ${SITE_PATH}/$path exists"
  else
    fail "${SITE_PATH}/$path NOT found"
  fi
done
log ""

# ═══════════════════════════════════════════════════════════
# Phase 2: Create Content Pages Under Blueprint
# ═══════════════════════════════════════════════════════════

log "Phase 2: Creating content pages under blueprint"
log ""

# 2.1 — Homepage
log "2.1 Creating homepage..."
create_page "${SITE_PATH}/language-masters/us/en/home" "Home"

# 2.2 — Navigation fragment
log "2.2 Creating navigation fragment..."
create_page "${SITE_PATH}/language-masters/us/en/nav" "Navigation"

# 2.3 — Footer fragment
log "2.3 Creating footer fragment..."
create_page "${SITE_PATH}/language-masters/us/en/footer" "Footer"

# 2.4 — Verify content pages
log ""
log "2.4 Verifying content pages..."
for page in home nav footer; do
  if page_exists "${SITE_PATH}/language-masters/us/en/$page"; then
    log "  ✅ ${SITE_PATH}/language-masters/us/en/$page exists"
  else
    fail "${SITE_PATH}/language-masters/us/en/$page NOT found"
  fi
done
log ""

# ═══════════════════════════════════════════════════════════
# Phase 3: Configure Blueprint
# ═══════════════════════════════════════════════════════════

log "Phase 3: Configuring blueprint"
log ""

# 3.1 — Set blueprint flag
log "3.1 Setting blueprint configuration..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:content/cq:isBlueprint=true" \
  -F "jcr:content/cq:isBlueprint@TypeHint=Boolean" \
  "$AEM_HOST${SITE_PATH}/language-masters/us/en")
check_response "$HTTP_CODE" "Set blueprint config"

# 3.2 — Verify blueprint
log "3.2 Verifying blueprint configuration..."
BP_CHECK=$(curl -s \
  -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST${SITE_PATH}/language-masters/us/en/jcr:content.json" 2>/dev/null)
if echo "$BP_CHECK" | grep -q '"cq:isBlueprint":true'; then
  log "  ✅ Blueprint configured correctly"
else
  log "  ⚠️  Blueprint flag may not be set — check manually in Sites Console"
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 4: Create Live Copy
# ═══════════════════════════════════════════════════════════

log "Phase 4: Creating Live Copy"
log ""

# Check if live copy path already exists
if page_exists "${SITE_PATH}/us/en"; then
  log "  ⚠️  ${SITE_PATH}/us/en already exists"
  log "  Checking if it's already a live copy..."
  LC_CHECK=$(curl -s \
    -H "Authorization: Bearer $AEM_TOKEN" \
    "$AEM_HOST${SITE_PATH}/us/en/jcr:content.json" 2>/dev/null)
  if echo "$LC_CHECK" | grep -q "language-masters"; then
    log "  ✅ Already a live copy from language-masters — skipping creation"
  else
    log "  Creating live copy (existing page will be converted)..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "Authorization: Bearer $AEM_TOKEN" \
      -F "cmd=createLiveCopy" \
      -F "srcPath=${SITE_PATH}/language-masters/us/en" \
      -F "destPath=${SITE_PATH}/us/en" \
      -F "title=English (US)" \
      -F "label=en" \
      -F "rolloutConfigs=/libs/msm/wcm/rolloutconfigs/default" \
      -F "deep=true" \
      "$AEM_HOST/libs/wcm/msm/content/commands/createLiveCopy")
    check_response "$HTTP_CODE" "Create live copy"
  fi
else
  # 4.1 — Create live copy
  log "4.1 Creating live copy..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $AEM_TOKEN" \
    -F "cmd=createLiveCopy" \
    -F "srcPath=${SITE_PATH}/language-masters/us/en" \
    -F "destPath=${SITE_PATH}/us/en" \
    -F "title=English (US)" \
    -F "label=en" \
    -F "rolloutConfigs=/libs/msm/wcm/rolloutconfigs/default" \
    -F "deep=true" \
    "$AEM_HOST/libs/wcm/msm/content/commands/createLiveCopy")
  check_response "$HTTP_CODE" "Create live copy"
fi

# 4.3 — Verify live copy
log ""
log "4.3 Verifying live copy relationship..."
if page_exists "${SITE_PATH}/us/en"; then
  log "  ✅ ${SITE_PATH}/us/en exists"
else
  fail "Live copy at ${SITE_PATH}/us/en NOT found after creation"
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 5: Initial Rollout
# ═══════════════════════════════════════════════════════════

log "Phase 5: Triggering initial rollout"
log ""

# 5.1 — Deep rollout
log "5.1 Rolling out blueprint to live copy (deep)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "cmd=rollout" \
  -F "path=${SITE_PATH}/language-masters/us/en" \
  -F "deep=true" \
  "$AEM_HOST/libs/wcm/msm/content/commands/rollout")
check_response "$HTTP_CODE" "Rollout"

# Wait for async rollout processing
log "  Waiting for rollout to complete..."
sleep 5

# 5.2-5.4 — Verify rolled out pages
log ""
log "5.2-5.4 Verifying rolled out pages..."
for page in home nav footer; do
  if page_exists "${SITE_PATH}/us/en/$page"; then
    log "  ✅ ${SITE_PATH}/us/en/$page rolled out successfully"
  else
    log "  ⚠️  ${SITE_PATH}/us/en/$page not found — rollout may still be processing"
  fi
done

# ═══════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════

log ""
log "═══════════════════════════════════════════════════════════"
log "SETUP COMPLETE"
log "═══════════════════════════════════════════════════════════"
log ""
log "Blueprint (author here):"
log "  ${SITE_PATH}/language-masters/us/en/home"
log "  ${SITE_PATH}/language-masters/us/en/nav"
log "  ${SITE_PATH}/language-masters/us/en/footer"
log ""
log "Live Copy (served by EDS):"
log "  ${SITE_PATH}/us/en/home    → /us/en/home"
log "  ${SITE_PATH}/us/en/nav     → /us/en/nav"
log "  ${SITE_PATH}/us/en/footer  → /us/en/footer"
log ""
log "Next steps:"
log "  1. Open Universal Editor to author content at the blueprint paths"
log "  2. Changes will auto-rollout to the live copy (standard config)"
log "  3. EDS serves content from the live copy via paths.json mapping"
log ""
