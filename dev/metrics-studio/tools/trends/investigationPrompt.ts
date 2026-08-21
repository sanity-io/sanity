/**
 * Assembles a self-contained investigation brief for a suspicious trend point,
 * meant to be pasted into a coding agent (Claude Code, Cursor, …) as a prompt.
 * Everything the popover knows — the metric, both commits, the delta, every
 * backlink — plus the investigation recipe from perf/bench/README.md, so the
 * agent starts with the full signal instead of re-deriving it from the chart.
 * Pure string building: kept out of the popover so it can be unit tested.
 */
import {
  formatValue,
  INP_MIN_INTERACTIONS,
  type TrendPoint,
  type TrendSeries,
  type TrendUnit,
} from './data'
import {ciRunUrl, commitUrl, compareUrl, prUrl, sourceFileUrl} from './links'

/** Signed delta. The slope units already carry their sign in formatValue. */
function formatDelta(delta: number, unit: TrendUnit): string {
  if (unit === 'mb-per-min' || unit === 'count-per-min' || unit === 'ms-per-min') {
    return formatValue(delta, unit)
  }
  return `${delta < 0 ? '-' : '+'}${formatValue(Math.abs(delta), unit)}`
}

/**
 * The local-repro command for series measured by a bench scenario. Series keys
 * for those are `<kind>:<scenario>:<label>` (see buildSeries); bundle/soak/
 * environment series have no single-scenario repro, so they get none.
 */
function localReproCommand(seriesKey: string): string | undefined {
  const [kind, scenario, ...labelParts] = seriesKey.split(':')
  if (kind === 'interaction') return `pnpm bench run --scenario ${scenario}`
  if (kind === 'pageload') {
    // INP is filed under the pageload *kind* only for dashboard grouping — it
    // is measured by its own harness mode (see perf/bench collectInp)
    const mode = labelParts.join(':') === 'INP' ? 'inp' : 'pageload'
    return `pnpm bench run --mode ${mode} --scenario ${scenario}`
  }
  return undefined
}

export function buildInvestigationPrompt(
  series: TrendSeries,
  point: TrendPoint,
  previousPoint: TrendPoint,
): string {
  const when =
    series.xKind === 'minute'
      ? `minute ${Math.round(point.date.getTime() / 60_000)} of the run`
      : point.date.toISOString().slice(0, 10)
  const delta = point.value - previousPoint.value
  const percent =
    previousPoint.value === 0
      ? undefined
      : `${delta < 0 ? '' : '+'}${((delta / Math.abs(previousPoint.value)) * 100).toFixed(1)}%`
  const percentiles = [
    point.p75 !== undefined ? `p75 ${formatValue(point.p75, series.unit)}` : undefined,
    point.p90 !== undefined ? `p90 ${formatValue(point.p90, series.unit)}` : undefined,
  ].filter(Boolean)
  const goal =
    series.goal === 'lower' ? 'Lower is better.' : 'Context metric — no better/worse direction.'
  const valueLabel = series.lineLabel ?? 'median (p50)'
  const repro = localReproCommand(series.key)

  const signal = [
    `- Metric: ${series.title} — ${series.description} ${goal}`,
    `- Suspicious run (${when}): ${valueLabel} ${formatValue(point.value, series.unit)}${
      percentiles.length > 0 ? ` (${percentiles.join(', ')})` : ''
    }`,
    `- Measured commit: ${commitUrl(point.sha)}`,
    typeof point.prNumber === 'number' ? `- PR: ${prUrl(point.prNumber)}` : undefined,
    point.ciRunId ? `- CI run: ${ciRunUrl(point.ciRunId, point.ciRunAttempt)}` : undefined,
    `- Previous run on this line measured ${valueLabel} ${formatValue(
      previousPoint.value,
      series.unit,
    )} at ${previousPoint.sha.slice(0, 7)} — this run is ${formatDelta(delta, series.unit)}${
      percent ? ` (${percent})` : ''
    }`,
    `- Everything that landed in between: ${compareUrl(previousPoint.sha, point.sha)}`,
    series.sourceFile
      ? `- Scenario source at the measured commit: ${sourceFileUrl(series.sourceFile, point.sha)}`
      : undefined,
    `- benchRun document: ${point.runId} (metrics studio, dataset "bench")`,
    point.interactions !== undefined && point.interactions < INP_MIN_INTERACTIONS
      ? `- Caution: this INP came from only ${point.interactions} interactions (a reliable INP needs ${INP_MIN_INTERACTIONS}) — treat the value as low confidence.`
      : undefined,
  ].filter(Boolean)

  const steps = [
    `1. Read the compare range and shortlist commits that could plausibly move this metric (studio runtime code, dependency bumps, build config, or the bench harness/scenario itself).`,
    `2. Confirm with an A/B dispatch — the same harness CI uses, with bootstrap-gated verdicts:

   gh workflow run bench.yml -f ab_from=${previousPoint.sha} -f ab_to=${point.sha}

   The verdict table lands on that workflow run's summary page, and the comparison is stored as a mode:"ab" benchRun document (Comparisons tool in the metrics studio).`,
    `3. If the range is long, bisect it with further A/B dispatches (log2(N) runs find the culprit commit).`,
    repro
      ? `4. To iterate locally: pnpm build:bench && ${repro} — see perf/bench/README.md. Absolute numbers are host-relative; trust the A/B verdicts over point-to-point deltas.`
      : `4. See perf/bench/README.md for running the suite locally. Absolute numbers are host-relative; trust the A/B verdicts over point-to-point deltas.`,
  ]

  return `Investigate a suspected performance regression in the sanity-io/sanity monorepo.

## Signal

${signal.join('\n')}

## How to investigate

${steps.join('\n')}

Report the culprit commit or PR with evidence, or conclude that the step is noise.
`
}
