#!/usr/bin/env bash
# Measure @sanity/ui → v5 (ui5 alias) migration progress for a directory tree.
#
#   measure-progress.sh <dir> [v5-alias] [@sanity/ui]
#   measure-progress.sh <dir> --component Flex
#   measure-progress.sh <dir> ui5 @sanity/ui --component Box --component Flex
#
# Without --component: reports every component with at least one v5 value import.
# With --component:    reports only the named component(s), even if not on v5 yet.
#
# Per component:
#   - import file counts: v5, @sanity/ui, total (union of files)
#   - JSX instance counts: migrated (v5 binding), unmigrated (@sanity/ui binding), total
#   - styled() instance counts: migrated, unmigrated, total
#
# Instance counts resolve import aliases (`{ Box as UIBox }` → `<UIBox>`).
#
# Requires: ripgrep (rg), bash 4+

set -uo pipefail

usage() {
  cat <<'EOF'
Usage: measure-progress.sh <dir> [v5-alias] [@sanity/ui] [--component NAME ...]

  <dir>                 Directory tree to scan
  v5-alias              Side-by-side v5 package name (default: ui5)
  @sanity/ui            Legacy import path (default: @sanity/ui)
  --component, -c NAME  Report one component only; repeat for several (PascalCase)

With no --component flags, lists every component imported from the v5 alias.
With --component, reports that component even when migration has not started.
EOF
}

SEARCH_DIR=""
V5_PKG="ui5"
LEGACY_PKG="@sanity/ui"
REQUESTED_COMPONENTS=()

while [ $# -gt 0 ]; do
  case "$1" in
    -c | --component)
      [ $# -lt 2 ] && { echo "error: $1 requires a component name" >&2; exit 1; }
      REQUESTED_COMPONENTS+=("$2")
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [ -z "$SEARCH_DIR" ]; then
        SEARCH_DIR="$1"
      elif [ "$V5_PKG" = "ui5" ] && [ "$LEGACY_PKG" = "@sanity/ui" ] && [[ "$1" != @* ]] && [ ${#REQUESTED_COMPONENTS[@]} -eq 0 ]; then
        V5_PKG="$1"
      elif [ "$LEGACY_PKG" = "@sanity/ui" ] && [[ "$1" == @* ]]; then
        LEGACY_PKG="$1"
      else
        echo "error: unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      shift
      ;;
  esac
done

SEARCH_DIR="${SEARCH_DIR:-.}"

command -v rg >/dev/null || { echo "ripgrep (rg) required" >&2; exit 1; }

# Discover v5 alias from nearest package.json when default is used and ui5 imports are absent.
if [ "$V5_PKG" = "ui5" ] && ! rg -q "from ['\"]ui5['\"]" --glob '*.{ts,tsx}' "$SEARCH_DIR" 2>/dev/null; then
  detected=$(rg -o --no-filename '"([^"]+)":\s*"npm:@sanity/ui@' --glob 'package.json' "$SEARCH_DIR" -r '$1' 2>/dev/null | head -1)
  [ -n "$detected" ] && V5_PKG="$detected"
fi

has_v5_alias() {
  rg -q "\"${V5_PKG}\":" --glob 'package.json' "$SEARCH_DIR" 2>/dev/null
}

# Collect exported component names from v5 value imports (skip `type` specifiers).
discover_components() {
  # --no-filename: when scanning a directory rg prefixes each match with its path, which would
  # swallow the first specifier of every import in the sed/tr pipeline below.
  rg -U --multiline -o --no-filename "import \{([^}]+)\} from ['\"]${V5_PKG}['\"]" \
    --glob '*.ts' --glob '*.tsx' "$SEARCH_DIR" 2>/dev/null \
    | sed 's/^import {//;s/} from.*//' \
    | tr ',' '\n' \
    | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
    | rg -v '^type ' \
    | sed 's/ as .*//' \
    | rg '^[A-Z]' \
    | sort -u
}

# Count files containing a value import of COMPONENT from PACKAGE.
count_import_files() {
  local component="$1" package="$2"
  rg -lU --multiline \
    "import \{[^}]*?\b${component}\b[^}]*?\} from ['\"]${package}['\"]" \
    --glob '*.ts' --glob '*.tsx' "$SEARCH_DIR" 2>/dev/null \
    | wc -l | tr -d ' '
}

# file<TAB>localName for COMPONENT imported from PACKAGE (alias-aware).
resolve_bindings() {
  local component="$1" package="$2"
  local f local_name
  while IFS= read -r f; do
    local_name=$(rg -oU --multiline \
      "import \{[^}]*?\b${component}\b(\s+as\s+(\w+))?[^}]*?\} from ['\"]${package}['\"]" \
      -r '$2' "$f" 2>/dev/null | head -1)
    [ -z "$local_name" ] && local_name="$component"
    printf '%s\t%s\n' "$f" "$local_name"
  done < <(rg -lU --multiline \
    "import \{[^}]*?\b${component}\b[^}]*?\} from ['\"]${package}['\"]" \
    --glob '*.ts' --glob '*.tsx' "$SEARCH_DIR" 2>/dev/null)
}

# Sum JSX and styled() hits for bindings from one package.
count_instances() {
  local component="$1" package="$2" kind="$3"
  local jsx=0 styled=0 file local_name hits
  while IFS=$'\t' read -r file local_name; do
    if [ "$kind" = "jsx" ] || [ "$kind" = "both" ]; then
      hits=$(rg "<${local_name}[\s/>]" --glob '*.tsx' --glob '*.jsx' "$file" 2>/dev/null | wc -l | tr -d ' ')
      jsx=$((jsx + hits))
    fi
    if [ "$kind" = "styled" ] || [ "$kind" = "both" ]; then
      hits=$(rg "styled\\(${local_name}\\)" --glob '*.ts' --glob '*.tsx' "$file" 2>/dev/null | wc -l | tr -d ' ')
      styled=$((styled + hits))
    fi
  done < <(resolve_bindings "$component" "$package")
  if [ "$kind" = "jsx" ]; then echo "$jsx"
  elif [ "$kind" = "styled" ]; then echo "$styled"
  else echo "$jsx $styled"
  fi
}

# Union of import files for legacy + v5.
count_total_import_files() {
  local component="$1"
  {
    rg -lU --multiline \
      "import \{[^}]*?\b${component}\b[^}]*?\} from ['\"]${V5_PKG}['\"]" \
      --glob '*.ts' --glob '*.tsx' "$SEARCH_DIR" 2>/dev/null
    rg -lU --multiline \
      "import \{[^}]*?\b${component}\b[^}]*?\} from ['\"]${LEGACY_PKG}['\"]" \
      --glob '*.ts' --glob '*.tsx' "$SEARCH_DIR" 2>/dev/null
  } | sort -u | wc -l | tr -d ' '
}

pct() {
  local part="$1" whole="$2"
  if [ "$whole" -eq 0 ]; then echo "—"
  else awk "BEGIN {printf \"%.0f%%\", ($part / $whole) * 100}"
  fi
}

if [ ${#REQUESTED_COMPONENTS[@]} -gt 0 ]; then
  components=$(printf '%s\n' "${REQUESTED_COMPONENTS[@]}" | sort -u)
  mode="component"
else
  components=$(discover_components)
  mode="discover"
fi

if [ -z "$components" ]; then
  if [ "$mode" = "component" ]; then
    echo "No component names provided." >&2
    exit 1
  fi

  if has_v5_alias; then
    echo "No migration progress to report under ${SEARCH_DIR}."
    echo "The '${V5_PKG}' alias is listed in package.json but no value imports from '${V5_PKG}' were found."
    echo "Migration may not have started yet, or the search directory may be too narrow."
  else
    echo "No migration progress to report under ${SEARCH_DIR}."
    echo "No v5 side-by-side alias ('${V5_PKG}') found in package.json under this tree."
    echo "This repo does not appear to have a v5 install — nothing to measure."
  fi
  echo "Pass a component to measure legacy usage before migration: measure-progress.sh <dir> --component Flex"
  exit 0
fi

if [ "$mode" = "component" ] && ! has_v5_alias; then
  echo "Note: no '${V5_PKG}' alias in package.json — v5 counts will be zero." >&2
fi

echo "Sanity UI migration progress"
echo "  directory:  ${SEARCH_DIR}"
echo "  v5 alias:     ${V5_PKG}"
echo "  legacy pkg:   ${LEGACY_PKG}"
if [ "$mode" = "component" ]; then
  echo "  components:   $(echo "$components" | tr '\n' ' ' | sed 's/ $//')"
else
  echo "  components:   all with v5 imports"
fi
echo

printf '%-12s %7s %7s %7s %7s %7s %7s %6s %7s %7s %7s %6s\n' \
  "Component" \
  "v5 imp" "leg imp" "imp tot" \
  "jsx mig" "jsx unm" "jsx tot" "jsx%" \
  "sty mig" "sty unm" "sty tot" "sty%"
printf '%-12s %7s %7s %7s %7s %7s %7s %6s %7s %7s %7s %6s\n' \
  "────────────" \
  "───────" "───────" "───────" \
  "───────" "───────" "───────" "────" \
  "───────" "───────" "───────" "────"

tot_v5_imp=0 tot_leg_imp=0
tot_jsx_mig=0 tot_jsx_unm=0 tot_jsx=0
tot_sty_mig=0 tot_sty_unm=0 tot_sty=0
component_count=0

while IFS= read -r component; do
  [ -z "$component" ] && continue
  component_count=$((component_count + 1))

  v5_imp=$(count_import_files "$component" "$V5_PKG")
  leg_imp=$(count_import_files "$component" "$LEGACY_PKG")
  imp_tot=$(count_total_import_files "$component")

  jsx_mig=$(count_instances "$component" "$V5_PKG" jsx)
  jsx_unm=$(count_instances "$component" "$LEGACY_PKG" jsx)
  jsx_tot=$((jsx_mig + jsx_unm))

  sty_mig=$(count_instances "$component" "$V5_PKG" styled)
  sty_unm=$(count_instances "$component" "$LEGACY_PKG" styled)
  sty_tot=$((sty_mig + sty_unm))

  jsx_pct=$(pct "$jsx_mig" "$jsx_tot")
  sty_pct=$(pct "$sty_mig" "$sty_tot")

  printf '%-12s %7s %7s %7s %7s %7s %7s %6s %7s %7s %7s %6s\n' \
    "$component" "$v5_imp" "$leg_imp" "$imp_tot" \
    "$jsx_mig" "$jsx_unm" "$jsx_tot" "$jsx_pct" \
    "$sty_mig" "$sty_unm" "$sty_tot" "$sty_pct"

  tot_v5_imp=$((tot_v5_imp + v5_imp))
  tot_leg_imp=$((tot_leg_imp + leg_imp))
  tot_jsx_mig=$((tot_jsx_mig + jsx_mig))
  tot_jsx_unm=$((tot_jsx_unm + jsx_unm))
  tot_jsx=$((tot_jsx + jsx_tot))
  tot_sty_mig=$((tot_sty_mig + sty_mig))
  tot_sty_unm=$((tot_sty_unm + sty_unm))
  tot_sty=$((tot_sty + sty_tot))
done <<< "$components"

if [ "$component_count" -gt 1 ]; then
  printf '%-12s %7s %7s %7s %7s %7s %7s %6s %7s %7s %7s %6s\n' \
    "────────────" \
    "───────" "───────" "───────" \
    "───────" "───────" "───────" "────" \
    "───────" "───────" "───────" "────"
  printf '%-12s %7s %7s %7s %7s %7s %7s %6s %7s %7s %7s %6s\n' \
    "TOTAL" "$tot_v5_imp" "$tot_leg_imp" "—" \
    "$tot_jsx_mig" "$tot_jsx_unm" "$tot_jsx" "$(pct "$tot_jsx_mig" "$tot_jsx")" \
    "$tot_sty_mig" "$tot_sty_unm" "$tot_sty" "$(pct "$tot_sty_mig" "$tot_sty")"
fi

echo
echo "Legend:"
echo "  v5 imp / leg imp  — files with a value import from the v5 alias / @sanity/ui"
echo "  imp tot           — union of v5 + legacy import files for that component"
echo "  jsx mig / unm     — <LocalName> hits via alias-resolved bindings per file"
echo "  jsx %             — migrated JSX / total JSX instances"
echo "  sty mig / unm     — styled(LocalName) hits via alias-resolved bindings per file"
