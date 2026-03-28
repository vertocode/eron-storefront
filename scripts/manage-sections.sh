#!/bin/bash
# Manage homepage dynamic sections via Shopify Admin API
# Usage:
#   ./scripts/manage-sections.sh list       — list all section metaobjects
#   ./scripts/manage-sections.sh current    — show current homepage sections
#   ./scripts/manage-sections.sh set <id1> <id2> ... — set homepage sections (ordered)
#   ./scripts/manage-sections.sh add <id>   — append a section to homepage
#   ./scripts/manage-sections.sh remove <id> — remove a section from homepage

SHOP="eronfit"
CLIENT_ID="e107622a90120ff256d05416ab60ae80"
CLIENT_SECRET="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"
API_VERSION="2024-10"
BASE_URL="https://${SHOP}.myshopify.com/admin/api/${API_VERSION}/graphql.json"

# Get access token
get_token() {
  curl -s -X POST \
    "https://${SHOP}.myshopify.com/admin/oauth/access_token" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])"
}

gql() {
  local token="$1"
  local query="$2"
  curl -s -X POST "$BASE_URL" \
    -H 'Content-Type: application/json' \
    -H "X-Shopify-Access-Token: $token" \
    -d "{\"query\": $(echo "$query" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}"
}

# Section types we recognize
SECTION_TYPES='["herobanner","featuredproducts","featuredcollections","richtext","imagewithtext","banner","newsletter","testimonials","videosection","faq","countdowntimer","logolist"]'

cmd_list() {
  local token=$(get_token)
  echo "📦 Available section metaobjects:"
  echo ""

  local result=$(gql "$token" '{
    metaobjects(first: 50, type: "herobanner") { nodes { id type fields { key value } } }
  }')
  echo "$result" | python3 -c "
import sys, json
types = $SECTION_TYPES
" 2>/dev/null

  # Query all section types
  for stype in herobanner featuredproducts featuredcollections richtext imagewithtext banner newsletter testimonials videosection faq countdowntimer logolist; do
    local result=$(gql "$token" "{ metaobjects(first: 20, type: \"$stype\") { nodes { id type fields { key value } } } }")
    echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
nodes = data.get('data', {}).get('metaobjects', {}).get('nodes', [])
for n in nodes:
    title = ''
    for f in n.get('fields', []):
        if f['key'] in ('title', 'heading', 'text'):
            title = f.get('value', '') or ''
            break
    label = title if title else '(no title)'
    print(f\"  {n['type']:25s} {n['id']:50s}  {label}\")
" 2>/dev/null
  done
}

cmd_current() {
  local token=$(get_token)
  echo "🏠 Current homepage sections:"
  echo ""

  local result=$(gql "$token" '{
    page(handle: "homepage") {
      metafield(namespace: "custom", key: "sections") {
        value
        references(first: 20) {
          nodes {
            ... on Metaobject {
              id
              type
              fields { key value }
            }
          }
        }
      }
    }
  }')

  echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
mf = data.get('data', {}).get('page', {}).get('metafield')
if not mf:
    print('  (no sections configured)')
    sys.exit(0)
nodes = mf.get('references', {}).get('nodes', [])
if not nodes:
    print('  (empty)')
    sys.exit(0)
for i, n in enumerate(nodes):
    title = ''
    for f in n.get('fields', []):
        if f['key'] in ('title', 'heading', 'text'):
            title = f.get('value', '') or ''
            break
    label = title if title else '(no title)'
    print(f\"  {i+1}. {n['type']:25s} {label:30s}  {n['id']}\")
"
}

get_homepage_id() {
  local token="$1"
  gql "$token" '{ page(handle: "homepage") { id } }' \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['page']['id'])"
}

get_current_ids() {
  local token="$1"
  gql "$token" '{
    page(handle: "homepage") {
      metafield(namespace: "custom", key: "sections") { value }
    }
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
mf = data.get('data', {}).get('page', {}).get('metafield')
if mf and mf.get('value'):
    ids = json.loads(mf['value'])
    print(' '.join(ids))
else:
    print('')
"
}

update_sections() {
  local token="$1"
  shift
  local ids=("$@")
  local page_id=$(get_homepage_id "$token")

  # Build JSON array
  local json_ids=$(python3 -c "import json; print(json.dumps([$(printf '"%s",' "${ids[@]}" | sed 's/,$//')]))")

  local mutation="mutation {
    metafieldsSet(metafields: [{
      ownerId: \"${page_id}\"
      namespace: \"custom\"
      key: \"sections\"
      type: \"list.metaobject_reference\"
      value: $(echo "$json_ids" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read().strip()))')
    }]) {
      metafields { id }
      userErrors { field message }
    }
  }"

  local result=$(gql "$token" "$mutation")
  local errors=$(echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
errors = data.get('data', {}).get('metafieldsSet', {}).get('userErrors', [])
if errors:
    for e in errors:
        print(f\"Error: {e['message']}\")
else:
    print('Done!')
" 2>/dev/null)
  echo "$errors"
}

cmd_set() {
  local token=$(get_token)
  echo "Setting homepage sections..."
  update_sections "$token" "$@"
  cmd_current
}

cmd_add() {
  local token=$(get_token)
  local new_id="$1"
  local current=$(get_current_ids "$token")
  local ids=($current $new_id)
  echo "Adding $new_id to homepage sections..."
  update_sections "$token" "${ids[@]}"
  cmd_current
}

cmd_remove() {
  local token=$(get_token)
  local remove_id="$1"
  local current=$(get_current_ids "$token")
  local ids=()
  for id in $current; do
    if [ "$id" != "$remove_id" ]; then
      ids+=("$id")
    fi
  done
  echo "Removing $remove_id from homepage sections..."
  update_sections "$token" "${ids[@]}"
  cmd_current
}

case "${1:-help}" in
  list)    cmd_list ;;
  current) cmd_current ;;
  set)     shift; cmd_set "$@" ;;
  add)     shift; cmd_add "$@" ;;
  remove)  shift; cmd_remove "$@" ;;
  *)
    echo "Usage: $0 {list|current|set|add|remove}"
    echo ""
    echo "  list                  — list all section metaobjects"
    echo "  current               — show current homepage sections"
    echo "  set <id1> <id2> ...   — replace homepage sections (ordered)"
    echo "  add <id>              — append a section to homepage"
    echo "  remove <id>           — remove a section from homepage"
    ;;
esac
