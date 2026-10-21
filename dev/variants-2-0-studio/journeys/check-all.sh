#!/bin/sh
# Every check, one summary line each. Both servers must run. sh journeys/check-all.sh
cd "$(dirname "$0")/.."
for s in verify verify-d1 verify-crud verify-open verify-pills verify-shape verify-layout verify-toasts verify-c2b verify-c3 verify-lens verify-create-pick verify-story-links verify-ga-lenses verify-launcher verify-toggle verify-picker-forms verify-context verify-site-nav verify-remote verify-marks-model verify-compare-model verify-marks verify-pane-address verify-compare verify-review verify-list verify-rowwidth verify-refs verify-variants-filter verify-one-banner verify-loop verify-pane-control verify-base verify-openbeta verify-header verify-c3e verify-localization; do
  out=$(node journeys/$s.mts 2>&1)
  echo "$s: $(echo "$out" | grep -c '^PASS') pass, $(echo "$out" | grep -c '^FAIL') fail"
  echo "$out" | grep '^FAIL' | head -5
done
out=$(node journeys/dryrun.mts 2>&1)
echo "dryrun: $(echo "$out" | grep -c ' OK ') ok, $(echo "$out" | grep -cE 'FAIL|ERROR') fail, low-contrast lines: $(echo "$out" | grep -c 'low contrast')"
echo "$out" | grep -E 'FAIL|ERROR' | head -5
echo "$out" | grep -o 'low contrast[^]]*' | sort | uniq -c | head -12
