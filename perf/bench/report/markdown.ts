import {type BenchRunDocument, type MetricReport, type ScenarioReport} from './types'

const VERDICT_ICON = {
  regression: '🔴',
  improvement: '🟢',
  neutral: '✅',
  inconclusive: '⚪',
} as const

const VERDICT_ORDER = {regression: 0, inconclusive: 1, improvement: 2, neutral: 3} as const

function formatMs(value: number): string {
  return `${value.toFixed(0)}ms`
}

function formatEfps(latencyMs: number): string {
  const efps = 1000 / latencyMs
  return efps >= 100 ? '99.9+' : efps.toFixed(1)
}

function formatDiff(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}ms`
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`
}

function formatUnit(value: number, unit: MetricReport['unit']): string {
  return unit === 'count' ? value.toFixed(0) : formatMs(value)
}

function metricValue(metric: MetricReport, side: 'experiment' | 'reference'): string {
  const sideMetric = side === 'experiment' ? metric.experiment : metric.reference
  if (!sideMetric) return '—'
  const median = sideMetric.summary.median
  return metric.presentAsEfps
    ? `${formatEfps(median)} eFPS (${formatMs(median)})`
    : formatUnit(median, metric.unit)
}

function comparisonCell(metric: MetricReport): string {
  if (!metric.comparison) return '—'
  const {diff, lo, hi, verdict} = metric.comparison
  return `${formatDiff(diff)} [${formatDiff(lo)}, ${formatDiff(hi)}] ${VERDICT_ICON[verdict]}`
}

function metricsTable(scenarios: ScenarioReport[], kind: ScenarioReport['kind']): string {
  const relevant = scenarios.filter((scenario) => scenario.kind === kind)
  if (relevant.length === 0) return '_not run_\n'

  const hasReference = relevant.some((scenario) =>
    scenario.metrics.some((metric) => metric.reference),
  )
  const rows = relevant.flatMap((scenario) =>
    scenario.metrics
      .toSorted(
        (a, b) =>
          VERDICT_ORDER[a.comparison?.verdict ?? 'neutral'] -
          VERDICT_ORDER[b.comparison?.verdict ?? 'neutral'],
      )
      .map((metric) => {
        const name = `${scenario.scenario} · ${metric.label}`
        return hasReference
          ? `| ${name} | ${metricValue(metric, 'reference')} | ${metricValue(metric, 'experiment')} | ${comparisonCell(metric)} |`
          : `| ${name} | ${metricValue(metric, 'experiment')} |`
      }),
  )
  const header = hasReference
    ? '| Benchmark | Reference | Experiment | Δ median [95% confidence interval] |\n| :-- | :-- | :-- | :-- |'
    : '| Benchmark | Result |\n| :-- | :-- |'
  return `${header}\n${rows.join('\n')}\n`
}

function detailsSection(run: BenchRunDocument): string {
  const percentileRows = run.scenarios.flatMap((scenario) =>
    scenario.metrics.map((metric) => {
      const experiment = metric.experiment.summary
      const sessions = metric.experiment.sessions.length
      const format = (value: number) => formatUnit(value, metric.unit)
      return `| ${scenario.scenario} · ${metric.label} | ${format(experiment.median)} | ${format(experiment.p75)} | ${format(experiment.p90)} | ${format(experiment.p99)} | ${sessions} |`
    }),
  )

  const failureRows = run.scenarios.flatMap((scenario) =>
    scenario.failures.map(
      (failure) => `| ${scenario.scenario} | ${failure.side} | ${failure.reason} |`,
    ),
  )

  const interruptionRows = run.scenarios.map((scenario) => {
    const {experiment, reference} = scenario.interruptions
    return `| ${scenario.scenario} | ${experiment.count} (${formatMs(experiment.totalMs)}) | ${reference ? `${reference.count} (${formatMs(reference.totalMs)})` : '—'} |`
  })

  const attribution = run.scenarios
    .flatMap((scenario) => scenario.loafAttribution)
    .toSorted((a, b) => b.totalMs - a.totalMs)
    .slice(0, 5)
    .map(
      (script) =>
        `| ${script.sourceUrl.split('/').at(-1) ?? script.sourceUrl} | ${script.functionName || '(anonymous)'} | ${formatMs(script.totalMs)} |`,
    )

  return [
    '<details>',
    '<summary>Details: percentiles, interruptions, flake telemetry, run metadata</summary>',
    '',
    '#### Experiment percentiles',
    '| Benchmark | p50 | p75 | p90 | p99 | sessions |',
    '| :-- | :-- | :-- | :-- | :-- | :-- |',
    ...percentileRows,
    '',
    '#### Read-only interruptions (count / total time paused)',
    '| Scenario | Experiment | Reference |',
    '| :-- | :-- | :-- |',
    ...interruptionRows,
    '',
    ...(failureRows.length > 0
      ? [
          '#### Retried session failures (flake telemetry)',
          '| Scenario | Side | Reason |',
          '| :-- | :-- | :-- |',
          ...failureRows,
          '',
        ]
      : []),
    ...(attribution.length > 0
      ? [
          '#### Top main-thread blockers (long animation frames)',
          '| Script | Function | Total |',
          '| :-- | :-- | :-- |',
          ...attribution,
          '',
        ]
      : []),
    '#### Run metadata',
    `- mode: ${run.mode}, seed ${run.config.seed}, CPU throttle ${run.config.cpuThrottleRate}x`,
    `- git: \`${run.git.sha.slice(0, 10)}\` on \`${run.git.branch}\`${run.git.mergeBaseSha ? ` vs merge-base \`${run.git.mergeBaseSha.slice(0, 10)}\`` : ''}`,
    `- runner: ${run.runner.os}/${run.runner.arch}, ${run.runner.cpus} cpus, node ${run.runner.nodeVersion}, calibration ${formatMs(run.runner.calibrationMs)} (higher = slower host)`,
    ...run.scenarios
      .filter((scenario) => scenario.stoppedBy && scenario.stoppedBy !== 'converged')
      .map((scenario) => `- ⚠️ ${scenario.scenario}: sampling stopped by ${scenario.stoppedBy}`),
    '</details>',
  ].join('\n')
}

/**
 * Resources — report-only, never a verdict: request counts/bytes are exact
 * in the hermetic environment (⚠️ on meaningful deltas), CPU/memory are
 * per-session medians.
 */
function resourcesSection(run: BenchRunDocument): string {
  const withResources = run.scenarios.filter((scenario) => scenario.resources)
  if (withResources.length === 0) return ''

  const hasReference = withResources.some((scenario) => scenario.resources?.reference)
  const formatCount = (value: number | undefined) => (value === undefined ? '—' : value.toFixed(0))
  const formatMb = (value: number | undefined) =>
    value === undefined ? '—' : `${value.toFixed(1)} MB`

  const rows = withResources.map((scenario) => {
    const {experiment, reference} = scenario.resources!
    const cells = [
      `${scenario.scenario}`,
      hasReference
        ? `${formatCount(reference?.requestCount)} → ${formatCount(experiment.requestCount)}${
            reference && Math.abs(experiment.requestCount - reference.requestCount) > 5 ? ' ⚠️' : ''
          }`
        : formatCount(experiment.requestCount),
      hasReference
        ? `${formatKb(reference?.requestBytes ?? 0)} → ${formatKb(experiment.requestBytes)}${
            reference && Math.abs(experiment.requestBytes - reference.requestBytes) > 64 * 1024
              ? ' ⚠️'
              : ''
          }`
        : formatKb(experiment.requestBytes),
      formatCount(experiment.cpuTaskMs),
      formatCount(experiment.cpuScriptMs),
      formatMb(experiment.heapMb),
      formatCount(experiment.domNodes),
      formatCount(experiment.listeners),
    ]
    return `| ${cells.join(' | ')} |`
  })

  return [
    '#### Resources (report-only)',
    `| Scenario | Requests${hasReference ? ' (ref → exp)' : ''} | Bytes${hasReference ? ' (ref → exp)' : ''} | CPU task ms | CPU script ms | Heap | DOM nodes | Listeners |`,
    '| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |',
    ...rows,
    '',
  ].join('\n')
}

function bundleSection(run: BenchRunDocument): string {
  if (!run.bundle) return ''
  const {experiment, reference} = run.bundle
  if (!reference) {
    return `**Bundle**: initial JS ${formatKb(experiment.initialJsBytes)} gzip, total ${formatKb(experiment.totalJsBytes)} gzip (${experiment.chunkCount} chunks)\n`
  }
  const initialDiff = experiment.initialJsBytes - reference.initialJsBytes
  const totalDiff = experiment.totalJsBytes - reference.totalJsBytes
  const flag = Math.abs(initialDiff) > 10 * 1024 ? ' ⚠️' : ''
  return (
    `**Bundle** (gzip): initial JS ${formatKb(reference.initialJsBytes)} → ${formatKb(experiment.initialJsBytes)} ` +
    `(Δ ${initialDiff >= 0 ? '+' : ''}${formatKb(initialDiff)})${flag}, ` +
    `total ${formatKb(reference.totalJsBytes)} → ${formatKb(experiment.totalJsBytes)} ` +
    `(Δ ${totalDiff >= 0 ? '+' : ''}${formatKb(totalDiff)})\n`
  )
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

/** Render the PR comment (always posted — all-neutral is information). */
export function renderMarkdownReport(
  run: BenchRunDocument,
  options: {missingScenarios?: MissingScenario[]} = {},
): string {
  const missing = options.missingScenarios ?? []
  const verdicts = run.scenarios
    .flatMap((scenario) => scenario.metrics)
    .map((metric) => metric.comparison?.verdict)
    .filter((verdict): verdict is NonNullable<typeof verdict> => verdict !== undefined)
  const regressions = verdicts.filter((verdict) => verdict === 'regression').length
  const improvements = verdicts.filter((verdict) => verdict === 'improvement').length
  const inconclusive = verdicts.filter((verdict) => verdict === 'inconclusive').length

  const headline =
    run.mode === 'absolute'
      ? 'absolute run (no reference build — comparison unavailable)'
      : regressions > 0
        ? `**${regressions} regression(s)** detected`
        : inconclusive > 0
          ? `no regressions confirmed (${inconclusive} metric(s) inconclusive)`
          : improvements > 0
            ? `no regressions — ${improvements} improvement(s)`
            : 'no significant changes'

  const link = dashboardLink(run)

  return [
    '### ⚡ Studio performance benchmark',
    '',
    headline,
    ...(link ? ['', link] : []),
    // A failed shard uploads no results — say so loudly instead of
    // rendering a clean table with a scenario silently absent
    ...(missing.length > 0
      ? [
          '',
          `> ⚠️ **Missing results:** ${missing
            .map((item) => `${item.scenario} (${item.kind})`)
            .join(', ')} — the benchmark shard(s) failed or were skipped; see the workflow run.`,
        ]
      : []),
    '',
    '#### Editing responsiveness',
    metricsTable(run.scenarios, 'interaction'),
    '_eFPS = editor frames per second (1000 ÷ median keystroke latency; higher is better)._',
    '',
    '#### Load',
    metricsTable(run.scenarios, 'pageload'),
    '_Time to editable = navigation start until the form accepts a keystroke._',
    '',
    bundleSection(run),
    resourcesSection(run),
    detailsSection(run),
    '',
  ].join('\n')
}
