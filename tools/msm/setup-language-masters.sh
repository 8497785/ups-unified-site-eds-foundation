#!/bin/bash
#
# AEM Language Masters & MSM Live Copy Setup Script
#
# Restructures the About UPS EDS project to the MSM language-masters model:
#   1. Creates a language-only blueprint at /content/about-ups-eds/language-masters/en
#   2. Copies the EXISTING content from /content/about-ups-eds/us/en into the
#      blueprint (so current authored pages become the master source)
#   3. Marks the blueprint, (re)creates the us/en live copy from it, and rolls out
#
# Authoring/translation happens in language-masters/en. Locale delivery copies
# (us/en, …) are served by EDS via paths.json (us/en -> /).
#
# Adding more locales later (example):
#   - Language copy:  /content/about-ups-eds/language-masters/fr  (translate here)
#   - Live copy:      /content/about-ups-eds/fr/fr  (rollout target)
#   - paths.json:     map /content/about-ups-eds/fr/fr/ -> /fr/  (or a separate site)
#
# IMPORTANT: Back up /content/about-ups-eds/us/en before running — this script
# copies it into the blueprint and converts us/en into a live copy.
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
MASTER_PATH="${SITE_PATH}/language-masters/en"
LIVECOPY_PATH="${SITE_PATH}/us/en"

log() { echo "[$(date '+%H:%M:%S')] $1"; }
fail() { echo "[ERROR] $1" >&2; exit 1; }

check_response() {
  local code="$1"
  local step="$2"
  if [[ "$code" -ge 200 && "$code" -lt 300 ]] || [[ "$code" == "201" ]]; then
    log "  ✅ $step (HTTP $code)"
  elif [[ "$code" == "500" ]] || [[ "$code" == "409" ]]; then
    log "  ⚠️  $step (HTTP $code — may already exist, continuing)"
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
# Phase 1: Validate Access & Create Blueprint Root
# ═══════════════════════════════════════════════════════════

log "Phase 1: Validating access and creating blueprint root"
log ""

log "1.1 Testing AEM author connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST${SITE_PATH}.json")
[[ "$HTTP_CODE" == "200" ]] || fail "Cannot access AEM author (HTTP $HTTP_CODE). Check token/host."
log "  ✅ AEM author accessible (HTTP $HTTP_CODE)"
log ""

log "1.2 Creating Language Masters root..."
create_page "${SITE_PATH}/language-masters" "Language Masters"

log "1.3 Creating English language master (blueprint source)..."
create_page "$MASTER_PATH" "English" -F "jcr:content/jcr:language=en"

if page_exists "$MASTER_PATH"; then
  log "  ✅ $MASTER_PATH exists"
else
  fail "$MASTER_PATH NOT found"
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 2: Copy Existing us/en Content Into the Blueprint
# ═══════════════════════════════════════════════════════════

log "Phase 2: Copying existing content into the blueprint"
log ""

if ! page_exists "$LIVECOPY_PATH"; then
  log "  ⚠️  $LIVECOPY_PATH not found — nothing to copy; blueprint will start empty"
else
  # Copy each child page of us/en into language-masters/en (skip if already present).
  # AEM Cloud rejects WebDAV COPY (405); use the Sling POST servlet copy operation.
  log "2.1 Copying child pages from $LIVECOPY_PATH → $MASTER_PATH ..."

  # Enumerate immediate children (depth 1). Page child nodes are cq:Page.
  CHILD_JSON=$(curl -s -H "Authorization: Bearer $AEM_TOKEN" \
    "$AEM_HOST${LIVECOPY_PATH}.1.json" 2>/dev/null || true)
  CHILDREN=$(echo "$CHILD_JSON" \
    | grep -o '"[^"]*":{"jcr:primaryType":"cq:Page"' \
    | sed 's/":{.*//;s/"//g' || true)

  if [[ -z "$CHILDREN" ]]; then
    log "  ⚠️  Could not enumerate children; falling back to known pages"
    CHILDREN="home nav footer our-company"
  fi

  for child in $CHILDREN; do
    [[ "$child" == "jcr:content" ]] && continue
    if page_exists "${MASTER_PATH}/${child}"; then
      log "  ⏭️  ${MASTER_PATH}/${child} already exists — skipping copy"
      continue
    fi
    if ! page_exists "${LIVECOPY_PATH}/${child}"; then
      log "  ⏭️  ${LIVECOPY_PATH}/${child} not a page — skipping"
      continue
    fi
    # Sling copy: POST to the source with :operation=copy and :dest=<target path>.
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
      -H "Authorization: Bearer $AEM_TOKEN" \
      -F ":operation=copy" \
      -F ":dest=${MASTER_PATH}/${child}" \
      "$AEM_HOST${LIVECOPY_PATH}/${child}")
    check_response "$CODE" "Copy ${child} into blueprint"
  done
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 3: Configure Blueprint
# ═══════════════════════════════════════════════════════════

log "Phase 3: Configuring blueprint"
log ""

log "3.1 Setting blueprint flag on $MASTER_PATH ..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "jcr:content/cq:isBlueprint=true" \
  -F "jcr:content/cq:isBlueprint@TypeHint=Boolean" \
  "$AEM_HOST$MASTER_PATH")
check_response "$HTTP_CODE" "Set blueprint config"

BP_CHECK=$(curl -s -H "Authorization: Bearer $AEM_TOKEN" \
  "$AEM_HOST${MASTER_PATH}/jcr:content.json" 2>/dev/null)
if echo "$BP_CHECK" | grep -q '"cq:isBlueprint":true'; then
  log "  ✅ Blueprint configured correctly"
else
  log "  ⚠️  Blueprint flag may not be set — check manually in Sites Console"
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 4: Create / Verify Live Copy at us/en
# ═══════════════════════════════════════════════════════════

log "Phase 4: Creating live copy at $LIVECOPY_PATH"
log ""

create_live_copy() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $AEM_TOKEN" \
    -F "cmd=createLiveCopy" \
    -F "srcPath=$MASTER_PATH" \
    -F "destPath=$LIVECOPY_PATH" \
    -F "title=English (US)" \
    -F "label=en" \
    -F "rolloutConfigs=/libs/msm/wcm/rolloutconfigs/default" \
    -F "deep=true" \
    "$AEM_HOST/libs/wcm/msm/content/commands/createLiveCopy")
  check_response "$code" "Create live copy"
}

if page_exists "$LIVECOPY_PATH"; then
  LC_CHECK=$(curl -s -H "Authorization: Bearer $AEM_TOKEN" \
    "$AEM_HOST${LIVECOPY_PATH}/jcr:content.json" 2>/dev/null)
  if echo "$LC_CHECK" | grep -q "language-masters"; then
    log "  ✅ $LIVECOPY_PATH is already a live copy from language-masters — skipping"
  else
    log "  ⚠️  $LIVECOPY_PATH exists but is NOT a live copy."
    log "      Its content was copied into the blueprint in Phase 2."
    log "      To convert it into a live copy, remove/rename it first, then re-run,"
    log "      OR convert manually in the Sites Console. Skipping automatic convert"
    log "      to avoid destroying existing content."
  fi
else
  log "4.1 Creating live copy..."
  create_live_copy
fi

if page_exists "$LIVECOPY_PATH"; then
  log "  ✅ $LIVECOPY_PATH exists"
else
  fail "Live copy at $LIVECOPY_PATH NOT found after creation"
fi
log ""

# ═══════════════════════════════════════════════════════════
# Phase 5: Initial Rollout
# ═══════════════════════════════════════════════════════════

log "Phase 5: Triggering initial rollout"
log ""

log "5.1 Rolling out blueprint to live copy (deep)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $AEM_TOKEN" \
  -F "cmd=rollout" \
  -F "path=$MASTER_PATH" \
  -F "deep=true" \
  "$AEM_HOST/libs/wcm/msm/content/commands/rollout")
check_response "$HTTP_CODE" "Rollout"

log "  Waiting for rollout to complete..."
sleep 5

# ═══════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════

log ""
log "═══════════════════════════════════════════════════════════"
log "SETUP COMPLETE"
log "═══════════════════════════════════════════════════════════"
log ""
log "Blueprint / master (author + translate here):"
log "  $MASTER_PATH"
log ""
log "Live Copy (served by EDS, us/en -> / via paths.json):"
log "  $LIVECOPY_PATH"
log ""
log "Next steps:"
log "  1. Author content at the blueprint ($MASTER_PATH) in Universal Editor"
log "  2. Roll out to us/en (and future locale live copies)"
log "  3. EDS serves the live copy via paths.json mapping"
log ""
