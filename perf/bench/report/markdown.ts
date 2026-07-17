import {type BenchRunDocument, type ScenarioReport} from './types'

/** Signed ms delta, e.g. "+4.2ms" / "-1.0ms". */
function formatDiff(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}ms`
}

/** Truncate + quote a chart-axis label so the Mermaid x-axis stays legible. */
function axisLabel(label: string): string {
  const tail = label.length > 22 ? `…${label.slice(-21)}` : label
  return `"${tail.replace(/"/g, '')}"`
}

/**
 * A Mermaid bar chart of the regression deltas (ms slower). GitHub renders
 * Mermaid natively, so no image hosting is needed — it degrades to a code
 * block anywhere that doesn't. Labels are truncated to keep the axis legible.
 */
function regressionChart(regressed: {label: string; comparison: {diff: number}}[]): string {
  const labels = regressed.map((entry) => axisLabel(entry.label)).join(', ')
  const values = regressed.map((entry) => entry.comparison.diff.toFixed(1)).join(', ')
  const max = Math.max(...regressed.map((entry) => entry.comparison.diff), 1)
  return [
    '```mermaid',
    'xychart-beta',
    '  title "Regression Δ (ms slower than reference)"',
    `  x-axis [${labels}]`,
    `  y-axis "ms" 0 --> ${Math.ceil(max * 1.15)}`,
    `  bar [${values}]`,
    '```',
  ].join('\n')
}

/** A scenario CI expected results for but no shard delivered. */
export interface MissingScenario {
  scenario: string
  kind: ScenarioReport['kind']
}

/** Deployed metrics studio; the Trends tool reads branches/range from the URL. */
const DASHBOARD_BASE_URL = 'https://studio-metrics.sanity.dev'

/**
 * Deep link to the Trends dashboard with this run's branch preselected
 * alongside main, so the reviewer lands on the comparison. Only meaningful
 * once the branch's run is stored (labeled PRs; see store-pr in bench.yml).
 */
function dashboardLink(run: BenchRunDocument): string | null {
  const branch = run.git.branch
  if (!branch || branch === 'main') return null
  const branches = encodeURIComponent(['main', branch].join(','))
  return `[📊 View on the trends dashboard](${DASHBOARD_BASE_URL}/trends?branches=${branches})`
}

/**
 * Render the PR comment — deliberately minimal. It answers only "is there
 * anything to worry about, and where do I go to look?"; the full tables,
 * percentiles, bundle/resource breakdown, and history live in the trends
 * dashboard (linked below). Always posted — all-neutral is information.
 */
export function renderMarkdownReport(
  run: BenchRunDocument,
  options: {missingScenarios?: MissingScenario[]} = {},
): string {
  const missing = options.missingScenarios ?? []
  // Per-PR INP (mode `inp`) is report-only (see gate.ts's INP_THRESHOLDS) —
  // its comparison must never feed the blocking regression/inconclusive
  // headline, only its own informational line below.
  const gatedScenarios = run.scenarios.filter((scenario) => scenario.mode !== 'inp')
  const regressed = gatedScenarios.flatMap((scenario) =>
    scenario.metrics
      .filter((metric) => metric.comparison?.verdict === 'regression')
      .map((metric) => ({
        label: `${scenario.scenario} · ${metric.label}`,
        comparison: metric.comparison!,
      })),
  )
  // Inconclusive verdicts exist precisely so a too-noisy run never reads as a
  // pass — count them into the headline instead of hiding them behind
  // "no regressions"
  const inconclusiveCount = gatedScenarios.reduce(
    (count, scenario) =>
      count +
      scenario.metrics.filter((metric) => metric.comparison?.verdict === 'inconclusive').length,
    0,
  )
  const inconclusiveSuffix =
    inconclusiveCount > 0 ? ` (${inconclusiveCount} inconclusive — CI too wide to decide)` : ''

  const inpLines = run.scenarios
    .filter((scenario) => scenario.mode === 'inp')
    .flatMap((scenario) =>
      scenario.metrics
        .filter((metric) => metric.comparison)
        .map((metric) => {
          const {diff, lo, hi, verdict} = metric.comparison!
          return `- \`${scenario.scenario} · ${metric.label}\` ${formatDiff(diff)} [${formatDiff(lo)}, ${formatDiff(hi)}] (${verdict})`
        }),
    )

  const headline =
    run.mode === 'absolute'
      ? '🔵 absolute run — see the dashboard for the trend'
      : regressed.length > 0
        ? `🔴 **${regressed.length} regression(s)** detected${inconclusiveSuffix}`
        : `✅ no regressions${inconclusiveSuffix}`

  // Only regressions are called out in detail here — everything else
  // (improvements, the inconclusive metrics themselves, the full tables and
  // history) lives in the dashboard. One line per regression plus a chart of
  // the deltas so the shape is visible without leaving the PR.
  const regressionLines = regressed.map((entry) => {
    const {diff, lo, hi} = entry.comparison
    return `- \`${entry.label}\` ${formatDiff(diff)} [${formatDiff(lo)}, ${formatDiff(hi)}]`
  })

  const link = dashboardLink(run)

  return [
    '### ⚡ Studio performance benchmark',
    '',
    headline,
    ...(regressionLines.length > 0 ? ['', ...regressionLines, '', regressionChart(regressed)] : []),
    // Informational only — never folded into the headline/regression count
    // above (see gatedScenarios)
    ...(inpLines.length > 0
      ? ['', 'ℹ️ **Per-PR INP** (report-only, not gated):', ...inpLines]
      : []),
    // A failed shard uploads no results — say so loudly instead of staying
    // silent about a scenario that never ran
    ...(missing.length > 0
      ? [
          '',
          `> ⚠️ **Missing results:** ${missing
            .map((item) => `${item.scenario} (${item.kind})`)
            .join(', ')} — the benchmark shard(s) failed or were skipped; see the workflow run.`,
        ]
      : []),
    ...(link ? ['', `${link} for the full tables, percentiles, and history.`] : []),
    '',
  ].join('\n')
}
