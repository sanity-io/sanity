import {delta, summarize, type Delta, type Summary} from './stats'

export type MetricUnit = 'ms' | 'bytes'

export interface MetricComparison {
  description: string
  diff: {median: Delta; p75: Delta}
  unit: MetricUnit
  v6: Summary
  v7: Summary
}

export interface VersionInfo {
  ref: string
  sanityVersion: string
  sha: string
}

/** Timings measured under one emulated network and CPU profile. */
export interface ProfileResult {
  /** Every sample runs in a fresh browser context with the HTTP cache disabled. */
  cacheDisabled: true
  /** CPU slowdown factor, 1 for none. */
  cpuThrottle: number
  metrics: Record<string, MetricComparison>
  /** `null` when the network is not emulated. */
  network: {downloadKbps: number; latencyMs: number; uploadKbps: number} | null
}

export interface ComparisonReport {
  environment: Record<string, string | number | boolean>
  generatedAt: string
  /** Build sizes, which do not depend on a profile. */
  metrics: Record<string, MetricComparison>
  /** Timings keyed by profile name. */
  profiles: Record<string, ProfileResult>
  schemaVersion: 2
  versions: {v6: VersionInfo; v7: VersionInfo}
}

export function compareMetric(
  description: string,
  unit: MetricUnit,
  v6Samples: number[],
  v7Samples: number[],
): MetricComparison {
  const v6 = summarize(v6Samples)
  const v7 = summarize(v7Samples)
  return {
    description,
    diff: {median: delta(v6.median, v7.median), p75: delta(v6.p75, v7.p75)},
    unit,
    v6,
    v7,
  }
}

function formatValue(value: number, unit: MetricUnit): string {
  if (unit === 'ms') return `${(value / 1000).toFixed(2)} s`
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(2)} MiB`
    : `${(value / 1024).toFixed(1)} KiB`
}

function formatDelta(change: Delta, unit: MetricUnit): string {
  const sign = change.absolute > 0 ? '+' : ''
  const percent = change.percent === null ? 'n/a' : `${sign}${change.percent.toFixed(1)}%`
  return `${sign}${formatValue(change.absolute, unit)} (${percent})`
}

function renderRows(metrics: Record<string, MetricComparison>): string[] {
  return Object.values(metrics).map((metric) => {
    const timed = metric.v6.samples.length > 1
    const cell = (summary: Summary) =>
      timed
        ? `${formatValue(summary.median, metric.unit)} (p75 ${formatValue(summary.p75, metric.unit)})`
        : formatValue(summary.median, metric.unit)
    return `| ${metric.description} | ${cell(metric.v6)} | ${cell(metric.v7)} | ${formatDelta(metric.diff.median, metric.unit)} |`
  })
}

function describeProfile(profile: ProfileResult): string {
  const {network} = profile
  const net = network
    ? `${network.latencyMs} ms RTT, ${network.downloadKbps / 1000} Mbps down / ${network.uploadKbps / 1000} Mbps up`
    : 'no network throttling'
  return `${net}, ${profile.cpuThrottle > 1 ? `${profile.cpuThrottle}x CPU throttle` : 'no CPU throttle'}, cache disabled`
}

const TABLE_HEAD = ['| Metric | v6 | v7 | Difference |', '| :-- | --: | --: | --: |']

/** Markdown for the job summary: sizes, then one timing table per profile (median, p75 in brackets). */
export function renderSummary(report: ComparisonReport): string {
  const {v6, v7} = report.versions
  const lines = [
    '## Studio v6 vs v7',
    '',
    `v6: \`${v6.ref}\` @ \`${v6.sha.slice(0, 10)}\` (sanity ${v6.sanityVersion}) · v7: \`${v7.ref}\` @ \`${v7.sha.slice(0, 10)}\` (sanity ${v7.sanityVersion})`,
    '',
    '### Bundle size',
    '',
    ...TABLE_HEAD,
    ...renderRows(report.metrics),
  ]
  for (const [name, profile] of Object.entries(report.profiles)) {
    lines.push(
      '',
      `### Load time: ${name}`,
      '',
      describeProfile(profile),
      '',
      ...TABLE_HEAD,
      ...renderRows(profile.metrics),
    )
  }
  lines.push(
    '',
    'Timings are the median over the runs (p75 in brackets), in seconds; sizes are exact. Difference is v7 relative to v6.',
    '',
    `Environment: ${Object.entries(report.environment)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')}`,
    '',
  )
  return lines.join('\n')
}
