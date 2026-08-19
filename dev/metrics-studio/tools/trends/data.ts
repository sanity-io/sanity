/**
 * Data layer for the Trends tool: one tightly-projected GROQ query (never
 * fetch `sessions` — see SPEC.md) and pure series derivation.
 */

export interface TrendRun {
  _id: string
  startedAt: string
  mode: 'ab' | 'absolute'
  git: {
    sha: string
    branch: string
    /** Committer date of `sha` — absent on documents stored before it existed. */
    committedAt?: string | null
    prNumber?: number
    mergeBaseSha?: string
  } | null
  runner: {calibrationMs: number; runId?: string; runAttempt?: number} | null
  bundle: {experiment: {initialJsBytes: number; totalJsBytes?: number | null} | null} | null
  scenarios:
    | {
        scenario: string
        sourceFile?: string
        /** Per-scenario shard runner calibration (multi-shard CI runs only). */
        runner?: {calibrationMs: number | null} | null
        kind: 'interaction' | 'pageload'
        metrics:
          | {
              label: string
              unit: 'ms' | 'count' | 'cls'
              experiment: {summary: {median: number; p75: number; p90: number} | null} | null
            }[]
          | null
        soak?: {
          minutes: number
          samples:
            | {
                minute: number
                heapMb: number
                domNodes: number
                listeners: number
                latencyP50Ms: number | null
                cpuTaskMs: number | null
                connections: number
                requests: number
              }[]
            | null
        } | null
      }[]
    | null
}

// Absolute-mode only: A/B dispatch runs store mode:'ab' comparison documents
// (two builds measured against each other) whose numbers are not points on
// any branch's series — they'd inject a historical commit into the main line.
export const TREND_QUERY = `*[_type == "benchRun" && mode == "absolute"] | order(coalesce(git.committedAt, startedAt) asc) {
  _id,
  startedAt,
  mode,
  git{sha, branch, committedAt, prNumber, mergeBaseSha},
  runner{calibrationMs, runId, runAttempt},
  bundle{experiment{initialJsBytes, totalJsBytes}},
  scenarios[]{
    scenario,
    sourceFile,
    runner{calibrationMs},
    kind,
    metrics[]{label, unit, experiment{summary{median, p75, p90}}},
    soak{minutes, samples[]{minute, heapMb, domNodes, listeners, latencyP50Ms, cpuTaskMs, connections, requests}}
  }
}`

export type TrendUnit =
  | 'ms'
  | 'count'
  | 'cls'
  | 'bytes'
  | 'megabytes'
  | 'mb-per-min'
  | 'count-per-min'
  | 'ms-per-min'

export interface TrendPoint {
  date: Date
  /** The plotted value (p50 for metrics). */
  value: number
  p75?: number
  p90?: number
  /**
   * INP points only: how many interactions the run's INP sessions observed
   * (median across sessions) — confidence context for the INP value, shown in
   * the tooltip/popover rather than charted as a series of its own. The
   * percentile rule wants at least INP_MIN_INTERACTIONS.
   */
  interactions?: number
  sha: string
  /** benchRun document id — opens the run in the studio. */
  runId: string
  /** Backlink metadata (GitHub PR / commit / CI run). */
  prNumber?: number
  ciRunId?: string
  ciRunAttempt?: number
}

/** One line within a chart — a single branch's run history for the metric. */
export interface TrendLine {
  branch: string
  points: TrendPoint[]
}

export interface TrendSeries {
  key: string
  title: string
  unit: TrendUnit
  /** One plain-English sentence: what this metric measures. */
  description: string
  /** How to read the trend: lower values are better, or context-only. */
  goal: 'lower' | 'context'
  /** Section the chart is grouped under in the dashboard. */
  group: TrendGroup
  /** Repo-root-relative scenario source file, for a "view source" backlink. */
  sourceFile?: string
  /**
   * What the x-axis represents. 'date' (default) plots run history over time;
   * 'minute' plots one run's samples over its elapsed minutes — the point
   * `date` field then encodes the minute (epoch + minute) so the time scale
   * works unchanged.
   */
  xKind?: 'date' | 'minute'
  /**
   * What one plotted point *is*, for the legend. Defaults to 'median (p50)' —
   * true for the interaction/pageload series, whose points are per-run medians
   * — but a soak slope point is a least-squares fit and an end-of-run point is
   * a single sample; calling those "median (p50)" would be a false label.
   */
  lineLabel?: string
  /**
   * Published "good" threshold for the metric, drawn as a reference rule on
   * the chart. Only set where a real recommendation exists (the web.dev Core
   * Web Vitals thresholds); made-up bars would dilute the real ones. Note the
   * honesty gap: web.dev thresholds are for field data at the 75th percentile,
   * while these charts plot lab-run medians — the bar is orientation, not a
   * pass/fail verdict.
   */
  goodThreshold?: number
  /** One line per branch (usually just one — comparison overlays several). */
  lines: TrendLine[]
}

/**
 * Where a run sits on the time axis: the measured commit's committer date.
 * Backfilled runs measure a historical commit long after the fact — plotting
 * them at `startedAt` stacks them all on the day the backfill ran instead of
 * spreading them across the dates being repaired. Older documents predate
 * `git.committedAt` and fall back to `startedAt` (within a day of the commit
 * for cron runs, so the axis stays honest).
 */
export function runDate(run: TrendRun): Date {
  return new Date(run.git?.committedAt || run.startedAt)
}

/** All git branches present in the runs, `main` first, then alphabetical. */
export function availableBranches(runs: TrendRun[]): string[] {
  const branches = new Set<string>()
  for (const run of runs) {
    if (run.git?.branch) branches.add(run.git.branch)
  }
  return [...branches].sort((a, b) => {
    if (a === 'main') return -1
    if (b === 'main') return 1
    return a.localeCompare(b)
  })
}

export type TrendGroup = 'vitals' | 'responsiveness' | 'load' | 'bundle' | 'soak' | 'environment'

/**
 * The soak sample fields we chart, with display metadata. A constant,
 * self-erasing workload means every one of these should stay flat over the
 * minutes of the run — any upward slope is a leak or degradation.
 */
export const SOAK_METRICS: {
  key:
    | 'heapMb'
    | 'domNodes'
    | 'listeners'
    | 'latencyP50Ms'
    | 'cpuTaskMs'
    | 'connections'
    | 'requests'
  title: string
  unit: TrendUnit
  description: string
}[] = [
  {
    key: 'heapMb',
    title: 'JS heap',
    unit: 'megabytes',
    description:
      'Post-GC heap size each minute. A rising slope under a constant workload is a memory leak.',
  },
  {
    key: 'domNodes',
    title: 'DOM nodes',
    unit: 'count',
    description:
      'Live DOM node count. Growth without new content means detached nodes are being retained.',
  },
  {
    key: 'listeners',
    title: 'Event listeners',
    unit: 'count',
    description:
      'Registered event listeners. A climb signals subscriptions that never get torn down.',
  },
  {
    key: 'latencyP50Ms',
    title: 'Keystroke latency',
    unit: 'ms',
    description:
      'Median keystroke latency that minute. Rising latency is degradation under sustained use.',
  },
  {
    key: 'cpuTaskMs',
    title: 'CPU task time',
    unit: 'ms',
    description:
      'Main-thread task time spent that minute. A trend up means the studio is doing more work over time.',
  },
  {
    key: 'connections',
    title: 'Listener connections',
    unit: 'count',
    description: 'Open realtime connections to the mock. Growth is a reconnect/resubscribe leak.',
  },
  {
    key: 'requests',
    title: 'Requests',
    unit: 'count',
    description:
      'Requests the studio made that minute. A rising rate is a polling or refetch loop.',
  },
]

export const TREND_GROUPS: {id: TrendGroup; title: string; description: string}[] = [
  {
    id: 'vitals',
    title: 'Web Vitals',
    // The individual vitals are named (and spelled out) by the per-vital
    // section headers right below, so the description doesn't list them
    description:
      'Google Core Web Vitals and supporting load metrics; lower is better on all of them. Measured in a canned environment (local API mock, no external network), so vitals that would only measure that setup are left out. TTFB, for example, would just time the mock.',
  },
  {
    id: 'responsiveness',
    title: 'Editing responsiveness',
    description: 'Per-keystroke latency (keydown → paint) while typing into each scenario.',
  },
  {
    id: 'load',
    title: 'Load',
    description: 'How long from opening a document until it is ready to edit, and what blocks it.',
  },
  {
    id: 'bundle',
    title: 'Bundle size',
    description:
      'How much JavaScript the build ships, and how much of it booting actually downloads.',
  },
  {
    id: 'soak',
    title: 'Soak (endurance)',
    description:
      'One long session typing continuously into a self-erasing document. Every line should stay flat. An upward slope is a leak or degradation over time.',
  },
  {
    id: 'environment',
    title: 'Calibration',
    description:
      'CI host speed per run. Every number in the other tabs depends on how fast the host was, so check here before trusting a spike.',
  },
]

/**
 * Plain-English description per metric so a first-time viewer can read the
 * dashboard without knowing the bench suite. Matched on the metric labels
 * emitted by perf/bench/report/collect.ts.
 */
function describeSeries(
  kind: 'interaction' | 'pageload',
  label: string,
): Pick<TrendSeries, 'description' | 'goal' | 'group' | 'goodThreshold'> {
  if (label.includes('time to editable')) {
    return {
      group: 'load',
      description: 'From navigation start until the document form accepts a keystroke.',
      goal: 'lower',
    }
  }
  if (label.includes('main-thread blocking')) {
    return {
      group: 'load',
      description:
        'How long the main thread was frozen during load (long animation frames). The UI is unresponsive for this time.',
      goal: 'lower',
    }
  }
  // goodThreshold values are the web.dev "good" recommendations
  // (https://web.dev/articles/defining-core-web-vitals-thresholds)
  if (label.endsWith('FCP')) {
    return {
      group: 'vitals',
      description: 'First Contentful Paint: first pixels drawn.',
      goal: 'lower',
      goodThreshold: 1800,
    }
  }
  if (label.endsWith('LCP')) {
    return {
      group: 'vitals',
      description: 'Largest Contentful Paint: the main content is visible (Core Web Vital).',
      goal: 'lower',
      goodThreshold: 2500,
    }
  }
  if (label.endsWith('CLS')) {
    return {
      group: 'vitals',
      description:
        'Cumulative Layout Shift: how much the layout jumps during load (Core Web Vital; lower is steadier).',
      goal: 'lower',
      goodThreshold: 0.1,
    }
  }
  if (label.endsWith('INP')) {
    return {
      group: 'vitals',
      description:
        'Interaction to Next Paint: a high percentile of interaction latencies (click/type → next paint) under a realistic interaction mix (Core Web Vital).',
      goal: 'lower',
      goodThreshold: 200,
    }
  }
  if (label.includes('boot JS')) {
    return {
      group: 'bundle',
      description:
        'Exact gzip sum of the JS chunks fetched before the document was editable (boot-cold): what booting actually downloads. The entry-chunk chart counts only what index.html references.',
      goal: 'lower',
    }
  }
  if (label.includes('auth round trips')) {
    return {
      group: 'load',
      description: 'Auth API round trips completed before the form was editable.',
      goal: 'lower',
    }
  }
  if (label.includes('auth first request')) {
    return {
      group: 'load',
      description:
        'How long after navigation the first auth request was issued. This is client-side work we control.',
      goal: 'lower',
    }
  }
  if (label.includes('auth in flight')) {
    return {
      group: 'load',
      description:
        'Time auth requests spent waiting on the API before the form was editable. Scales with real-world API latency.',
      goal: 'lower',
    }
  }
  if (kind === 'interaction') {
    return {
      group: 'responsiveness',
      description: `Median keystroke latency (keydown → paint) while typing into “${label}”.`,
      goal: 'lower',
    }
  }
  return {group: 'load', description: label, goal: 'lower'}
}

export function formatValue(value: number, unit: TrendUnit): string {
  if (unit === 'count') return value.toFixed(0)
  if (unit === 'cls') return value.toFixed(3) // unitless layout-shift score
  // MB past 1 MiB: the total-JS series runs to megabytes, where "2368.1 KB"
  // buries the magnitude a reader actually wants
  if (unit === 'bytes') {
    return Math.abs(value) >= 1024 * 1024
      ? `${(value / (1024 * 1024)).toFixed(2)} MB`
      : `${(value / 1024).toFixed(1)} KB`
  }
  if (unit === 'megabytes') return `${value.toFixed(1)} MB`
  // Slope units are signed and typically fractional — keep the sign and
  // enough precision that a near-zero rate reads as "~0", not a rounded 0
  if (unit === 'mb-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)} MB/min`
  if (unit === 'count-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)}/min`
  if (unit === 'ms-per-min') return `${value >= 0 ? '+' : ''}${value.toFixed(2)} ms/min`
  // Seconds past 10s. Load metrics run to tens of thousands of ms, and a
  // "60000ms" tick does not fit the 44px axis gutter — it silently renders as
  // "0000ms", which reads as wrong data rather than as a clipped label. Below 10s
  // stay in exact ms: keystroke latency lives at 30–200ms, where "0.09s" would
  // throw away the precision the whole suite exists to measure.
  if (Math.abs(value) >= 10_000) {
    const seconds = value / 1000
    // One decimal under 100s keeps 27.0s distinguishable from 27.9s; past that
    // the extra digit is noise and costs width again
    return `${Math.abs(seconds) < 100 ? seconds.toFixed(1) : seconds.toFixed(0)}s`
  }
  return `${value.toFixed(0)}ms`
}

/**
 * Axis-tick variant of `formatValue`, sized for the 44px gutter — a label that
 * doesn't fit clips at the SVG edge from the left ("40.0 MB" → "0.0 MB"), which
 * reads as wrong data rather than as a clipped label. Position carries the
 * precision on an axis, so ticks trade decimals and padding for width; the
 * header and tooltip keep the full `formatValue` rendering.
 *
 * - Slope ticks are the number alone: the full form ("+1.08 MB/min") kept only
 *   its unit visible. The unit stays in the title ("… per minute") and header,
 *   and the "+" goes too — on an axis spanning zero the sign is the position.
 * - MB/KB ticks drop the space and any spurious decimals: "40.0 MB" (clips its
 *   first digit; "M" glyphs are wide) becomes "40MB". KB ticks round to whole
 *   units — nice() picks round *byte* values, so the KB form is fractional
 *   ("146.5 KB") and would both clip and imply precision a tick doesn't need.
 * - ms ticks speak ONE unit per axis, decided by the scale top (`domainMax`),
 *   not per tick: formatValue's per-value cutoff put "10.0s" above "5000ms" on
 *   the same axis, which reads as two different scales.
 * - ms ticks switch to seconds already at 1s, not at formatValue's 10s:
 *   a four-digit ms tick ("8000ms") overflows the gutter by a couple of
 *   pixels, which shaves the leading glyph's left stroke — "8000" reads as
 *   "3000", "6000" as "5000". A wrong-but-plausible number is worse than an
 *   obviously clipped one. Sub-second axes (keystroke latency) stay in ms,
 *   where three digits fit and the precision matters.
 */
export function formatTick(value: number, unit: TrendUnit, domainMax = 0): string {
  if (isSignedUnit(unit)) return parseFloat(value.toFixed(2)).toString()
  if (unit === 'megabytes') return `${parseFloat(value.toFixed(1))}MB`
  if (unit === 'bytes') {
    return Math.abs(value) >= 1024 * 1024
      ? `${parseFloat((value / (1024 * 1024)).toFixed(1))}MB`
      : `${Math.round(value / 1024)}KB`
  }
  if (unit === 'ms' && Math.max(Math.abs(value), domainMax) >= 1_000) {
    return `${parseFloat((value / 1000).toFixed(1))}s`
  }
  return formatValue(value, unit)
}

/** Slope/rate units are signed and centered on zero (flat = good). */
export function isSignedUnit(unit: TrendUnit): boolean {
  return unit === 'mb-per-min' || unit === 'count-per-min' || unit === 'ms-per-min'
}

/** The per-minute slope unit for a soak metric's base unit. */
function slopeUnitFor(baseUnit: TrendUnit): TrendUnit {
  if (baseUnit === 'megabytes') return 'mb-per-min'
  if (baseUnit === 'ms') return 'ms-per-min'
  return 'count-per-min'
}

export function filterByRange(runs: TrendRun[], days: number | null): TrendRun[] {
  if (days === null) return runs
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return runs.filter((run) => runDate(run).getTime() >= cutoff)
}

/**
 * One series per scenario·metric across all runs, plus the bundle size. Each
 * series holds one line per git branch present in the runs — a single branch
 * renders as one line, several overlay for comparison.
 */
/** Backlink + identity fields every TrendPoint carries, derived from a run. */
function pointMeta(
  run: TrendRun,
): Pick<TrendPoint, 'sha' | 'runId' | 'prNumber' | 'ciRunId' | 'ciRunAttempt'> {
  return {
    sha: run.git?.sha ?? 'unknown',
    runId: run._id,
    prNumber: run.git?.prNumber,
    ciRunId: run.runner?.runId,
    ciRunAttempt: run.runner?.runAttempt,
  }
}

/**
 * Mirrors perf/bench/stats/inp.ts INP_MIN_INTERACTIONS — the percentile rule
 * wants at least this many interactions before an INP value is trustworthy.
 * Mirrored rather than imported, like the gate thresholds in drift.ts: the
 * dashboard has no build-time dependency on the bench suite.
 */
export const INP_MIN_INTERACTIONS = 50

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * One point per commit: several runs of the same sha are merged into their
 * median.
 *
 * CI re-runs the suite on a commit fairly often (4 shas in the stored history
 * have 2–3 runs each), and a run document can also contribute more than one
 * point to a series — the pageload scenario stores the INP metric twice. Left
 * unmerged, both cases put several dots on one x-position, weight that commit
 * several times in every median, and make a "7 runs" window cover fewer than 7
 * commits' worth of history.
 *
 * Median rather than mean, matching the p50/median language used throughout the
 * dashboard: a single throttled or failed re-run can't drag the point.
 *
 * The merged point keeps the *last* run's identity (runId, CI run, PR) so the
 * click-through opens a real document, and takes the median of `value`/`p75`/
 * `p90` independently. Note the honesty cost: re-runs of one commit often land
 * on hosts of different speed (sha 7147d045's two runs differ by 21% of
 * calibration), so a merged point averages across hosts. The calibration strip
 * is where that stays visible — and it is deliberately NOT merged, since its
 * whole job is showing per-run and cross-shard host spread.
 */
function mergeRunsPerCommit(points: TrendPoint[]): TrendPoint[] {
  const byCommit = new Map<string, TrendPoint[]>()
  for (const point of points) {
    // An unknown sha can't be de-duplicated by commit — key those by run so
    // they stay distinct rather than collapsing into one blob
    const key = point.sha === 'unknown' ? `run:${point.runId}` : point.sha
    const group = byCommit.get(key)
    if (group) group.push(point)
    else byCommit.set(key, [point])
  }

  const merged: TrendPoint[] = []
  for (const group of byCommit.values()) {
    const last = group[group.length - 1]
    if (group.length === 1) {
      merged.push(last)
      continue
    }
    const p75s = group.map((point) => point.p75).filter((v): v is number => v !== undefined)
    const p90s = group.map((point) => point.p90).filter((v): v is number => v !== undefined)
    const interactionCounts = group
      .map((point) => point.interactions)
      .filter((v): v is number => v !== undefined)
    merged.push({
      ...last,
      value: medianOf(group.map((point) => point.value)),
      p75: p75s.length > 0 ? medianOf(p75s) : undefined,
      p90: p90s.length > 0 ? medianOf(p90s) : undefined,
      interactions: interactionCounts.length > 0 ? medianOf(interactionCounts) : undefined,
    })
  }
  return merged.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function buildSeries(runs: TrendRun[]): TrendSeries[] {
  const series = new Map<string, TrendSeries>()
  const push = (
    key: string,
    title: string,
    unit: TrendUnit,
    meta: Pick<
      TrendSeries,
      'description' | 'goal' | 'group' | 'sourceFile' | 'lineLabel' | 'goodThreshold'
    >,
    run: TrendRun,
    point: Pick<TrendPoint, 'value' | 'p75' | 'p90' | 'interactions'>,
  ) => {
    const existing = series.get(key) ?? {key, title, unit, ...meta, lines: []}
    const branch = run.git?.branch ?? 'unknown'
    let line = existing.lines.find((candidate) => candidate.branch === branch)
    if (!line) {
      line = {branch, points: []}
      existing.lines.push(line)
    }
    line.points.push({date: runDate(run), ...pointMeta(run), ...point})
    series.set(key, existing)
  }

  for (const run of runs) {
    for (const scenario of run.scenarios ?? []) {
      // The interaction count is confidence context for INP, not a health
      // metric of its own — a chart of it answers no question ("are counts
      // trending?" is nothing anyone asks) and its default goal framing is
      // backwards (more interactions = MORE confidence). Attach it to the
      // INP point instead, where the tooltip/popover can qualify the value.
      const inpInteractions = scenario.metrics?.find(
        (metric) => metric.label === 'INP interactions',
      )?.experiment?.summary?.median
      for (const metric of scenario.metrics ?? []) {
        if (metric.label === 'INP interactions') continue
        // TTFB is no longer collected (against the local mock it was a 2–10ms
        // constant of the bench setup, not a studio signal) — but documents
        // stored before its removal still carry it, so skip it here too
        if (metric.label.endsWith('TTFB')) continue
        const summary = metric.experiment?.summary
        if (!summary) continue
        push(
          `${scenario.kind}:${scenario.scenario}:${metric.label}`,
          `${scenario.scenario} · ${metric.label}`,
          metric.unit,
          {...describeSeries(scenario.kind, metric.label), sourceFile: scenario.sourceFile},
          run,
          {
            value: summary.median,
            p75: summary.p75,
            p90: summary.p90,
            ...(metric.label === 'INP' && inpInteractions !== undefined
              ? {interactions: inpInteractions}
              : {}),
          },
        )
      }
    }
    const initialJs = run.bundle?.experiment?.initialJsBytes
    if (typeof initialJs === 'number') {
      // Key stays 'bundle:initialJs' (acks and deep links reference it), but
      // the title stopped claiming this is what boot downloads: it's only the
      // chunk index.html references, ~6% of the build — the studio loads the
      // rest through dynamic imports before it is usable.
      push(
        'bundle:initialJs',
        'bundle · entry chunk (gzip)',
        'bytes',
        {
          group: 'bundle',
          description:
            'The one JS chunk index.html references, gzip-compressed. Not what boot downloads: the studio dynamic-imports most of its code from here.',
          goal: 'lower',
          // A build measures one size — there is no distribution to take a
          // median of, so the default 'median (p50)' legend would be false
          lineLabel: 'size per run',
        },
        run,
        {value: initialJs},
      )
    }
    const totalJs = run.bundle?.experiment?.totalJsBytes
    if (typeof totalJs === 'number') {
      push(
        'bundle:totalJs',
        'bundle · total JS (gzip)',
        'bytes',
        {
          group: 'bundle',
          description:
            'Gzipped bytes of every JS chunk in the build; the ceiling on what a session can download. Boot fetches most of it through dynamic imports.',
          goal: 'lower',
          lineLabel: 'size per run',
        },
        run,
        {value: totalJs},
      )
    }
  }
  // Merge after collection: one point per commit per line (calibrationSeries is
  // deliberately left unmerged — see mergeRunsPerCommit)
  return [...series.values()].map((entry) => ({
    ...entry,
    lines: entry.lines.map((line) => ({...line, points: mergeRunsPerCommit(line.points)})),
  }))
}

/**
 * Vitals-tab layout: one section per vital, not a flat scenario-ordered grid.
 * The tab's question is per-vital ("how is LCP doing, everywhere?"), so all of
 * one vital's charts sit under a shared header — same unit, similar scale —
 * and a single scenario going bad stands out from its neighbours. Core Web
 * Vitals first — INP leading, since responsiveness is this studio's whole
 * reason to exist — then the supporting diagnostics; within a section, titles
 * (= scenarios) keep a stable alphabetical order.
 */
const VITALS = [
  {vital: 'INP', name: 'Interaction to Next Paint'},
  {vital: 'LCP', name: 'Largest Contentful Paint'},
  {vital: 'CLS', name: 'Cumulative Layout Shift'},
  {vital: 'FCP', name: 'First Contentful Paint'},
] as const

export interface VitalSection {
  vital: string
  /** Spelled-out name for the section header; absent for the catch-all. */
  name?: string
  series: TrendSeries[]
}

const byTitle = (a: TrendSeries, b: TrendSeries) => a.title.localeCompare(b.title)

export function vitalSections(list: TrendSeries[]): VitalSection[] {
  const matched = new Set<TrendSeries>()
  const sections: VitalSection[] = VITALS.map(({vital, name}) => {
    const series = list.filter((entry) => entry.title.endsWith(vital)).sort(byTitle)
    for (const entry of series) matched.add(entry)
    return {vital, name, series}
  })
  // Anything in the vitals group that isn't a known vital still renders —
  // a new metric must never silently vanish from the dashboard
  const leftover = list.filter((entry) => !matched.has(entry)).sort(byTitle)
  if (leftover.length > 0) sections.push({vital: 'Other', series: leftover})
  return sections.filter((section) => section.series.length > 0)
}

/** The honesty overlay: host-speed score per run (higher = slower host). */
export function calibrationSeries(runs: TrendRun[]): TrendSeries {
  // One line per branch, like the metric charts. Collecting every branch's
  // runs into a single line interleaves two host-speed curves into one path
  // (and stacks two dot trails on top of each other) — group by branch so
  // each is a clean, separately-coloured trail.
  const byBranch = new Map<string, TrendLine>()
  for (const run of runs) {
    // Multi-shard CI runs execute each scenario on a separate machine, so a
    // single document carries several host-speed scores (stamped per scenario
    // by mergeShards). Plot each distinct shard calibration as its own point —
    // the vertical spread at one date IS the cross-shard host variance. Older
    // documents (no per-scenario runner) fall back to the run-level score.
    const shardScores = new Set<number>()
    for (const scenario of run.scenarios ?? []) {
      if (typeof scenario.runner?.calibrationMs === 'number') {
        shardScores.add(scenario.runner.calibrationMs)
      }
    }
    const values =
      shardScores.size > 0 ? [...shardScores] : run.runner ? [run.runner.calibrationMs] : []
    if (values.length === 0) continue
    const branch = run.git?.branch ?? 'unknown'
    let line = byBranch.get(branch)
    if (!line) {
      line = {branch, points: []}
      byBranch.set(branch, line)
    }
    for (const value of values) {
      line.points.push({
        date: runDate(run),
        value,
        ...pointMeta(run),
      })
    }
  }
  return {
    key: 'runner:calibration',
    title: 'host calibration (higher = slower host)',
    unit: 'ms',
    description:
      'A fixed CPU workload run on the CI machine before each benchmark. All numbers above are relative to host speed. When this line spikes where a metric spikes, suspect the runner, not the studio.',
    goal: 'context',
    group: 'environment',
    lines: [...byBranch.values()],
  }
}

type SoakScenario = NonNullable<NonNullable<TrendRun['scenarios']>[number]['soak']>
type SoakSample = NonNullable<SoakScenario['samples']>[number]

/** Find each run's soak scenario (there's at most one), newest run first. */
function runsWithSoak(
  runs: TrendRun[],
): {run: TrendRun; soak: SoakScenario; sourceFile?: string}[] {
  return runs
    .map((run) => {
      const scenario = run.scenarios?.find((s) => s.soak?.samples?.length)
      return scenario?.soak ? {run, soak: scenario.soak, sourceFile: scenario.sourceFile} : null
    })
    .filter((entry) => entry !== null)
}

/**
 * In-run soak charts for the most recent run that has soak data: one chart
 * per SOAK_METRICS entry, x = elapsed minute. Empty when no run has soak.
 */
export function latestSoakCharts(runs: TrendRun[]): {run: TrendRun; charts: TrendSeries[]} | null {
  const withSoak = runsWithSoak(runs)
  const latest = withSoak.at(-1)
  if (!latest) return null
  const samples = (latest.soak.samples ?? []).toSorted((a, b) => a.minute - b.minute)

  const charts = SOAK_METRICS.map((metric): TrendSeries => {
    const points: TrendPoint[] = samples
      .map((sample) => ({sample, value: sample[metric.key]}))
      .filter(
        (entry): entry is {sample: SoakSample; value: number} => typeof entry.value === 'number',
      )
      .map(({sample, value}) => ({
        // Encode the minute as a Date so the time scale renders it unchanged
        date: new Date(sample.minute * 60_000),
        value,
        ...pointMeta(latest.run),
      }))
    return {
      key: `soak:latest:${metric.key}`,
      title: metric.title,
      unit: metric.unit,
      description: metric.description,
      goal: 'lower',
      group: 'soak',
      sourceFile: latest.sourceFile,
      xKind: 'minute',
      lineLabel: 'per-minute sample',
      lines: [{branch: latest.run.git?.branch ?? 'unknown', points}],
    }
  }).filter((chart) => chart.lines[0].points.length > 0)

  return {run: latest.run, charts}
}

/** Least-squares slope (value change per minute) of a soak sample series. */
function slopePerMinute(samples: SoakSample[], key: keyof SoakSample): number {
  const pairs = samples
    .map((sample) => ({x: sample.minute, y: sample[key]}))
    .filter((pair): pair is {x: number; y: number} => typeof pair.y === 'number')
  if (pairs.length < 2) return 0
  const n = pairs.length
  const sumX = pairs.reduce((acc, p) => acc + p.x, 0)
  const sumY = pairs.reduce((acc, p) => acc + p.y, 0)
  const sumXY = pairs.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumXX = pairs.reduce((acc, p) => acc + p.x * p.x, 0)
  const denominator = n * sumXX - sumX * sumX
  if (denominator === 0) return 0
  return (n * sumXY - sumX * sumY) / denominator
}

/** The end-of-run (last-minute) value of a soak metric, or null if absent. */
function lastSoakValue(samples: SoakSample[], key: keyof SoakSample): number | null {
  for (let i = samples.length - 1; i >= 0; i--) {
    const value = samples[i][key]
    if (typeof value === 'number') return value
  }
  return null
}

/**
 * Build a historical (one-dot-per-run) soak trend for every SOAK_METRIC, given
 * a per-run reducer. Used for both the slope view ("is the leak worsening
 * release over release?") and the end-of-run value view ("where did it land?").
 * One line per branch; empty series (no run had the metric) are dropped.
 */
function soakHistory(
  runs: TrendRun[],
  variant: 'slope' | 'latest',
  reduce: (samples: SoakSample[], key: keyof SoakSample) => number | null,
  meta: (
    metric: (typeof SOAK_METRICS)[number],
  ) => Pick<TrendSeries, 'title' | 'unit' | 'description' | 'lineLabel'>,
): TrendSeries[] {
  const withSoak = runsWithSoak(runs)
  const byMetric = SOAK_METRICS.map((metric): TrendSeries => {
    const lineByBranch = new Map<string, TrendLine>()
    let sourceFile: string | undefined
    for (const {run, soak, sourceFile: file} of withSoak) {
      const value = reduce(soak.samples ?? [], metric.key)
      if (value === null) continue
      sourceFile ??= file
      const branch = run.git?.branch ?? 'unknown'
      const line = lineByBranch.get(branch) ?? {branch, points: []}
      line.points.push({date: runDate(run), value, ...pointMeta(run)})
      lineByBranch.set(branch, line)
    }
    return {
      key: `soak:${variant}:${metric.key}`,
      goal: 'lower',
      group: 'soak',
      sourceFile,
      lines: [...lineByBranch.values()],
      ...meta(metric),
    }
  })
  return byMetric.filter((series) => series.lines.some((line) => line.points.length > 0))
}

/**
 * Slope-over-time trend for every soak metric: reduce each run's soak series to
 * a per-minute slope and plot it across runs. "Is the leak / degradation
 * getting worse release over release?" — a rising or non-zero slope is the
 * signal for any of them.
 */
export function soakSlopeSeries(runs: TrendRun[]): TrendSeries[] {
  return soakHistory(
    runs,
    'slope',
    (samples, key) => slopePerMinute(samples, key),
    (metric) => ({
      title: `soak · ${metric.title} per minute`,
      unit: slopeUnitFor(metric.unit),
      description: `${metric.title} change per soak minute (linear fit), per run. Flat (~0) is healthy; a rising slope across runs is a worsening leak or degradation.`,
      lineLabel: 'slope per run',
    }),
  )
}

/**
 * End-of-run value for every soak metric, across runs — a more literal history
 * than the slope: "where did each metric land by the end of the soak, release
 * over release?" Complements the slope view (a flat slope can still drift up in
 * absolute terms run to run).
 */
export function soakLatestValueSeries(runs: TrendRun[]): TrendSeries[] {
  return soakHistory(
    runs,
    'latest',
    (samples, key) => lastSoakValue(samples, key),
    (metric) => ({
      title: `soak · ${metric.title} at end`,
      unit: metric.unit,
      description: `${metric.title} at the end of the soak run, tracked across runs. ${metric.description}`,
      lineLabel: 'end-of-run value',
    }),
  )
}
