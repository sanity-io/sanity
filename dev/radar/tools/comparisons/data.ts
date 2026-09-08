/**
 * Data layer for the Comparisons tool: the `mode: 'ab'` benchRun documents
 * that A/B dispatches store — investigation records comparing two commits,
 * deliberately excluded from the Trends charts (see trends/data.ts). One
 * tightly-projected query; never fetch `sessions`.
 */

export type ComparisonVerdict = 'regression' | 'improvement' | 'neutral' | 'inconclusive'

export interface ComparisonMetric {
  label: string
  unit: 'ms' | 'count' | 'cls'
  experiment: {summary: {median: number} | null} | null
  reference: {summary: {median: number} | null} | null
  comparison: {diff: number; lo: number; hi: number; verdict: ComparisonVerdict} | null
}

export interface ComparisonScenario {
  scenario: string
  kind: 'interaction' | 'pageload'
  mode?: 'interaction' | 'pageload' | 'soak' | 'inp'
  metrics: ComparisonMetric[] | null
}

export interface ComparisonRun {
  _id: string
  startedAt: string
  git: {
    /** The experiment commit (`ab_to`). */
    sha: string
    /** The reference commit (`ab_from`). */
    mergeBaseSha?: string
    committedAt?: string | null
  } | null
  runner: {calibrationMs: number; runId?: string; runAttempt?: number} | null
  scenarios: ComparisonScenario[] | null
}

export const COMPARISONS_QUERY = `*[_type == "benchRun" && mode == "ab"] | order(startedAt desc) {
  _id,
  startedAt,
  git{sha, mergeBaseSha, committedAt},
  runner{calibrationMs, runId, runAttempt},
  scenarios[]{
    scenario,
    kind,
    mode,
    metrics[]{label, unit, experiment{summary{median}}, reference{summary{median}}, comparison{diff, lo, hi, verdict}}
  }
}`

/** Verdict counts across every judged metric of a run — the headline chips. */
export function verdictSummary(run: ComparisonRun): Record<ComparisonVerdict, number> {
  const counts: Record<ComparisonVerdict, number> = {
    regression: 0,
    improvement: 0,
    neutral: 0,
    inconclusive: 0,
  }
  for (const scenario of run.scenarios ?? []) {
    for (const metric of scenario.metrics ?? []) {
      if (metric.comparison) counts[metric.comparison.verdict] += 1
    }
  }
  return counts
}
