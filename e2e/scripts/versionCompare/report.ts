import {type RequestCategory, type RequestEntry} from './network'
import {delta, summarize, type Delta, type Summary} from './stats'
import {type Waterfall} from './waterfall'

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
  /** One traced load per version and authenticated page, keyed by page, kept out of the timings. */
  waterfalls: Record<string, {v6: Waterfall; v7: Waterfall}>
}

export interface ComparisonReport {
  environment: Record<string, string | number | boolean>
  generatedAt: string
  /** Build sizes, which do not depend on a profile. */
  metrics: Record<string, MetricComparison>
  /** Timings keyed by profile name. */
  profiles: Record<string, ProfileResult>
  schemaVersion: 4
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
    const timed = metric.unit === 'ms' && metric.v6.samples.length > 1
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

const seconds = (ms: number) => `${(ms / 1000).toFixed(2)} s`
const transferred = (bytes: {transferBytes: number; decodedBytes: number}) =>
  `${formatValue(bytes.transferBytes, 'bytes')} (${formatValue(bytes.decodedBytes, 'bytes')})`
const COUNTED: Array<[RequestCategory, string]> = [
  ['js', 'JS'],
  ['api', 'API'],
  ['preflight', 'OPTIONS preflights'],
  ['font', 'fonts'],
]

function requestLabel(request: RequestEntry, documentOrigin: string): string {
  const url = new URL(request.url)
  const where = url.origin === documentOrigin ? '' : url.host
  const label = `${request.method} ${where}${url.pathname}${url.search}`
  const short = label.length > 100 ? `${label.slice(0, 99)}…` : label
  return `\`${short.replaceAll('|', '%7C')}\``
}

function renderChain(waterfall: Waterfall): string[] {
  const documentOrigin = new URL(waterfall.chain[0]?.url ?? 'about:blank').origin
  const ms = (value: number | null) => (value === null ? '–' : `${Math.round(value)} ms`)
  return [
    '| Start | Queued | Wait | End | Transferred | Request | Kind |',
    '| --: | --: | --: | --: | --: | :-- | :-- |',
    ...waterfall.chain.map(
      (link) =>
        `| ${seconds(link.startMs)} | ${ms(link.queuedMs)} | ${ms(link.waitMs)} | ${link.endMs === null ? '–' : seconds(link.endMs)} | ${formatValue(link.transferBytes, 'bytes')} | ${requestLabel(link, documentOrigin)} | ${link.category}${link.protocol ? `, ${link.protocol}` : ''} |`,
    ),
  ]
}

/** One traced load per version: what the page fetched and did until it was ready. */
export function renderWaterfall(waterfall: {v6: Waterfall; v7: Waterfall}): string[] {
  const {v6, v7} = waterfall
  const row = (label: string, cell: (side: Waterfall) => string) =>
    `| ${label} | ${cell(v6)} | ${cell(v7)} |`
  const time = (side: Waterfall, pick: (main: NonNullable<Waterfall['mainThread']>) => number) =>
    side.mainThread ? seconds(pick(side.mainThread)) : 'n/a'
  const firstStart = (requests: RequestEntry[]) =>
    requests.length > 0 ? seconds(Math.min(...requests.map((request) => request.startMs))) : '–'
  const lastEnd = (requests: RequestEntry[]) => {
    const ends = requests.flatMap((request) => (request.endMs === null ? [] : [request.endMs]))
    return ends.length > 0 ? seconds(Math.max(...ends)) : '–'
  }
  const empty = {count: 0, decodedBytes: 0, transferBytes: 0}
  return [
    `#### What the \`${v7.path}\` load waits on`,
    '',
    'One traced load per version (Chrome trace and CDP network log, cut off at ready), kept out of the timings.',
    '',
    '| | v6 | v7 |',
    '| :-- | --: | --: |',
    row('Ready in the traced load', (side) => seconds(side.readyMs)),
    row('Requests started before ready', (side) => String(side.requests)),
    row(`… ${COUNTED.map(([, label]) => label).join(' / ')}`, (side) =>
      COUNTED.map(([category]) => String(side.byCategory[category]?.count ?? 0)).join(' / '),
    ),
    row('Bytes before ready, transferred (decoded)', transferred),
    row('JS before ready, transferred (decoded)', (side) =>
      transferred(side.byCategory.js ?? empty),
    ),
    row('First API request', (side) =>
      firstStart(side.notable.filter((request) => request.category === 'api')),
    ),
    row('Fonts and other-origin scripts (bridge.js) done', (side) =>
      lastEnd(side.notable.filter((request) => ['font', 'js'].includes(request.category))),
    ),
    row('Main thread busy before ready', (side) => time(side, (main) => main.busyMs)),
    row('… parse/compile / script / render / other', (side) =>
      side.mainThread
        ? [
            side.mainThread.parseCompileMs,
            side.mainThread.scriptMs,
            side.mainThread.renderMs,
            side.mainThread.otherMs,
          ]
            .map((value) => (value / 1000).toFixed(2))
            .join(' / ')
        : 'n/a',
    ),
    row(
      'Serial chain: requests, network / gaps / last response to ready',
      (side) =>
        `${side.chain.length}: ${[
          side.chainSplit.networkMs,
          side.chainSplit.gapMs,
          side.chainSplit.tailMs,
        ]
          .map((value) => (value / 1000).toFixed(2))
          .join(' / ')} s`,
    ),
    '',
    '<details><summary>Serial request chain to ready</summary>',
    '',
    'Each request waited on the one before it: the file that referenced it, its preflight, or for requests issued by code, the last response before the main-thread task that issued them. Queued covers connection queueing, DNS, connect and TLS; Wait is time to first byte.',
    '',
    '**v6**',
    '',
    ...renderChain(v6),
    '',
    '**v7**',
    '',
    ...renderChain(v7),
    '',
    '</details>',
  ]
}

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
    for (const waterfall of Object.values(profile.waterfalls)) {
      lines.push('', ...renderWaterfall(waterfall))
    }
  }
  lines.push(
    '',
    'Timings are the median over the runs (p75 in brackets), in seconds; build sizes are exact and JS received before ready is the median over the same loads. Difference is v7 relative to v6.',
    '',
    `Environment: ${Object.entries(report.environment)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ')}`,
    '',
  )
  return lines.join('\n')
}
