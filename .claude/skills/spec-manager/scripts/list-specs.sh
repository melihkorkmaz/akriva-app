#!/bin/bash
# List all specs with their status, design status, date, and title
# Usage: bash .claude/skills/spec-manager/scripts/list-specs.sh [type-filter]

SPECS_DIR=".claude/specs"
TYPE_FILTER="${1:-}"

if [ ! -d "$SPECS_DIR" ]; then
  echo "No specs directory found at $SPECS_DIR"
  exit 0
fi

# Extract a YAML frontmatter field from a markdown file (macOS/BSD compatible)
extract_field() {
  local file="$1"
  local field="$2"
  awk -v key="$field" '
    /^---$/ { fm++; next }
    fm == 1 && $0 ~ "^"key":" {
      val = $0
      sub("^"key":[ ]*", "", val)
      gsub(/^"/, "", val)
      gsub(/"$/, "", val)
      gsub(/[ \t]+$/, "", val)
      print val
      exit
    }
    fm >= 2 { exit }
  ' "$file"
}

# Header
printf "%-12s %-28s %-12s %-12s %-12s %s\n" "TYPE" "NAME" "SPEC" "DESIGN" "DATE" "TITLE"
printf "%-12s %-28s %-12s %-12s %-12s %s\n" "----" "----" "----" "------" "----" "-----"

found=0

for type_dir in "$SPECS_DIR"/*/; do
  [ -d "$type_dir" ] || continue
  type=$(basename "$type_dir")

  # Apply type filter if specified
  if [ -n "$TYPE_FILTER" ] && [ "$type" != "$TYPE_FILTER" ]; then
    continue
  fi

  for spec_dir in "$type_dir"*/; do
    [ -d "$spec_dir" ] || continue
    spec_file="$spec_dir/spec.md"
    design_file="$spec_dir/design.md"
    [ -f "$spec_file" ] || continue

    name=$(basename "$spec_dir")

    # Extract spec frontmatter fields
    spec_status=$(extract_field "$spec_file" "status")
    created=$(extract_field "$spec_file" "created")
    title=$(extract_field "$spec_file" "title")

    spec_status="${spec_status:-draft}"
    created="${created:-n/a}"
    title="${title:-Untitled}"

    # Extract design status if design.md exists
    if [ -f "$design_file" ]; then
      design_status=$(extract_field "$design_file" "status")
      design_status="${design_status:-draft}"
    else
      design_status="—"
    fi

    printf "%-12s %-28s %-12s %-12s %-12s %s\n" "$type" "$name" "$spec_status" "$design_status" "$created" "$title"
    found=$((found + 1))
  done
done

if [ "$found" -eq 0 ]; then
  if [ -n "$TYPE_FILTER" ]; then
    echo "No specs found for type: $TYPE_FILTER"
  else
    echo "No specs found."
  fi
fi

echo ""
echo "Total: $found spec(s)"

# Show readiness summary
if [ "$found" -gt 0 ]; then
  echo ""
  echo "Legend: SPEC/DESIGN status shown. Ready for implementation = both 'approved'."
fi
