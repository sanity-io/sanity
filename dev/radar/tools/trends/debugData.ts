/**
 * Dev-only synthetic data for the Trends tool: deterministic (seeded PRNG,
 * never Math.random) runs exhibiting the shapes the charts and the drift feed
 * must handle — steady noise, slow drift, step changes in both directions,
 * host-speed-correlated noise (why the calibration strip exists), an auth
 * round-trip drop, and sparse/single/empty datasets. It mirrors every shape CI
 * actually stores: both load conditions (boot-cold + open-doc-warm),
 * main-thread blocking, INP, soak, settle (green controls, a red-by-design
 * scenario, a re-regressed loop), and the PR/CI backlink fields.
 */
import {type TrendRun, type TrendTag} from './data'

/** mulberry32 — same tiny PRNG the bench fixtures use. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEBUG_SOURCES = ['demo', 'sparse', 'single-run', 'empty'] as const
export type DebugSource = (typeof DEBUG_SOURCES)[number]

const DAYS = 90
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Synthetic release schedule: day offset within the window and the version cut
 * that day. Shared by `generateDebugTags` (which turns these into `gitTag`-ish
 * markers) and `generateDemo` (which adds a release *run* for most of them), so
 * the debug data exercises both marker kinds — anchored to a measured run, and
 * placed by tag date where no run measured it.
 *
 * Deliberately awkward: the cadence is uneven, the 54/56 pair collides at
 * card width so label thinning gets hit, and day 70 is a major cutover.
 */
const RELEASE_SCHEDULE: {day: number; major: number; minor: number; patch: number}[] = [
  {day: 3, major: 6, minor: 8, patch: 0},
  {day: 14, major: 6, minor: 8, patch: 1},
  {day: 21, major: 6, minor: 8, patch: 2},
  {day: 30, major: 6, minor: 9, patch: 0},
  {day: 41, major: 6, minor: 9, patch: 1},
  {day: 54, major: 6, minor: 9, patch: 2},
  {day: 56, major: 6, minor: 10, patch: 0},
  {day: 70, major: 7, minor: 0, patch: 0},
  {day: 83, major: 7, minor: 1, patch: 0},
]

const versionOf = (entry: (typeof RELEASE_SCHEDULE)[number]) =>
  `v${entry.major}.${entry.minor}.${entry.patch}`

/**
 * The releases that got a benchmark run, keyed by day. The two oldest are left
 * unmeasured on purpose: release runs started partway through the real history
 * too, so a chart has to render both kinds side by side without looking
 * inconsistent.
 */
const MEASURED_RELEASES = new Map(
  RELEASE_SCHEDULE.slice(2).map((entry) => [entry.day, versionOf(entry)]),
)

function fakeSha(rng: () => number): string {
  return Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('')
}

function summary(rng: () => number, median: number) {
  const p50 = Math.max(1, median + (rng() - 0.5) * median * 0.06)
  return {median: p50, p75: p50 * (1.05 + rng() * 0.05), p90: p50 * (1.15 + rng() * 0.1)}
}

function metric(
  rng: () => number,
  label: string,
  median: number,
  unit: 'ms' | 'count' | 'cls' = 'ms',
): NonNullable<NonNullable<TrendRun['scenarios']>[number]['metrics']>[number] {
  return {
    label,
    unit,
    experiment: {
      // count/cls: exact value (summary() clamps to >=1, wrong for a CLS ~0.05)
      summary: unit === 'ms' ? summary(rng, median) : {median, p75: median, p90: median},
    },
  }
}

type DemoScenario = NonNullable<TrendRun['scenarios']>[number]

function settleScenarios(rng: () => number, day: number): DemoScenario[] {
  const settle = (
    scenario: string,
    options: {
      notSettled: number
      settleMs?: number
      commits: number
      loafMs: number
      cpuMs: number
      renders?: [component: string, count: number]
      redByDesign?: boolean
    },
  ): DemoScenario => ({
    scenario,
    sourceFile: `perf/bench/scenarios/${scenario === 'singleString' ? 'singleString' : 'customizations'}.ts`,
    kind: 'pageload',
    mode: 'settle',
    ...(options.redByDesign ? {settleExpectation: {expectedToSettle: false}} : {}),
    metrics: [
      metric(rng, 'sessions not settled', options.notSettled, 'count'),
      // The detector's own health line: flat zero unless the hook stub fails
      metric(rng, 'sessions without commit counter', 0, 'count'),
      metric(rng, 'settled sessions', options.notSettled === 4 ? 0 : 1, 'count'),
      metric(rng, 'ready sessions', 1, 'count'),
      ...(options.settleMs === undefined ? [] : [metric(rng, 'time to settle', options.settleMs)]),
      metric(rng, 'react commits after ready', options.commits, 'count'),
      metric(rng, 'LoAF blocking after ready', options.loafMs),
      metric(rng, 'cpu after ready', options.cpuMs),
      ...(options.renders
        ? [metric(rng, `renders · ${options.renders[0]}`, options.renders[1], 'count')]
        : []),
    ],
  })
  const previewLoops = day >= 75
  return [
    // Vanilla control: settles in ~4s, a few dozen commits
    settle('singleString', {notSettled: 0, settleMs: 3900, commits: 30, loafMs: 150, cpuMs: 700}),
    // Guards the #14241 fix; re-regresses at day 75 (inline paths array)
    settle('previewHeavy', {
      notSettled: previewLoops ? 4 : 0,
      settleMs: previewLoops ? undefined : 4100,
      commits: previewLoops ? 61_000 : 70,
      loafMs: previewLoops ? 40 : 190,
      cpuMs: previewLoops ? 29_500 : 1400,
      renders: ['previewHeavy.preview', previewLoops ? 30_000 : 48],
    }),
    // Red by design: useTemplatePermissions inline templateItems, ~2200 c/s
    settle('documentActions', {
      notSettled: 4,
      commits: 66_000,
      loafMs: 34,
      cpuMs: 30_000,
      redByDesign: true,
    }),
    // Custom S.component pane: nearly nothing to settle
    settle('structurePane', {notSettled: 0, settleMs: 520, commits: 1, loafMs: 130, cpuMs: 320}),
  ]
}

function generateDemo(branch = 'main', shift = 0): TrendRun[] {
  const rng = mulberry32(branch === 'main' ? 42 : 99)
  const start = Date.now() - DAYS * DAY_MS
  const runs: TrendRun[] = []

  for (let day = 0; day < DAYS; day++) {
    // Host speed wave (9–13ms) — some series correlate with it on purpose
    const calibration = 11 + 2 * Math.sin(day / 9) + (rng() - 0.5)
    const hostFactor = calibration / 11

    // Release runs exist on main only (releases are cut from main) and land a
    // few hours after the tag, as a dispatched CI run does — so the anchored
    // marker visibly sits on the run rather than on the tag's own timestamp
    const releaseTag = branch === 'main' ? MEASURED_RELEASES.get(day) : undefined
    const releaseOffsetMs = releaseTag ? 14 * 60 * 60 * 1000 : 0

    runs.push({
      _id: `debug-run-${branch}-${day}`,
      startedAt: new Date(start + day * DAY_MS + releaseOffsetMs).toISOString(),
      mode: 'absolute',
      ...(releaseTag ? {trigger: 'release' as const, releaseTag} : {trigger: 'cron' as const}),
      // Every ~9th run is a labeled PR run (has a PR number) so the run-detail
      // popover's PR backlink is exercised; all runs carry a CI run id/attempt.
      git: {sha: fakeSha(rng), branch, ...(day % 9 === 0 ? {prNumber: 13000 + day} : {})},
      runner: {calibrationMs: calibration, runId: `${900000 + day}`, runAttempt: 1},
      bundle: {
        experiment: {
          // Slow growth with an occasional dependency-bump jump
          initialJsBytes: Math.round(1_420_000 + day * 400 + (day > 55 ? 18_000 : 0)),
        },
      },
      scenarios: [
        {
          scenario: 'singleString',
          sourceFile: 'perf/bench/scenarios/singleString.ts',
          kind: 'interaction',
          metrics: [metric(rng, 'stringField', 32 + shift)], // steady (branch offset)
        },
        {
          scenario: 'article',
          sourceFile: 'perf/bench/scenarios/article.ts',
          kind: 'interaction',
          metrics: [
            metric(rng, 'title', 30 + day * 0.09), // slow drift up
            metric(rng, 'body', day < 60 ? 36 : 44), // step regression at day 60
          ],
        },
        {
          scenario: 'recipe',
          sourceFile: 'perf/bench/scenarios/recipe.ts',
          kind: 'interaction',
          metrics: [metric(rng, 'name', day < 45 ? 40 : 33)], // improvement at day 45
        },
        {
          scenario: 'synthetic',
          sourceFile: 'perf/bench/scenarios/synthetic.ts',
          kind: 'interaction',
          // Tracks host speed — read against the calibration strip
          metrics: [metric(rng, 'title', 34 * hostFactor)],
        },
        {
          scenario: 'singleString',
          sourceFile: 'perf/bench/scenarios/singleString.ts',
          kind: 'pageload',
          // CI measures two load conditions — boot-cold (first visit) and
          // open-doc-warm (cached) — so demo both. Warm is faster (cache hits).
          metrics: [
            metric(rng, 'boot-cold · time to editable', day < 70 ? 4200 : 4600),
            metric(rng, 'boot-cold · FCP', 1200 + (rng() - 0.5) * 200),
            metric(rng, 'boot-cold · LCP', 1800 + (rng() - 0.5) * 300),
            metric(rng, 'boot-cold · CLS', 0.04 + rng() * 0.03, 'cls'),
            metric(rng, 'boot-cold · main-thread blocking', 620 + (rng() - 0.5) * 120),
            // The auth story: a serialized round trip removed at day 50
            metric(rng, 'boot-cold · auth round trips', day < 50 ? 2 : 1, 'count'),
            metric(rng, 'boot-cold · auth in flight', day < 50 ? 84 : 42),
            metric(rng, 'open-doc-warm · time to editable', day < 70 ? 1900 : 2100),
            metric(rng, 'open-doc-warm · FCP', 520 + (rng() - 0.5) * 90),
            metric(rng, 'open-doc-warm · LCP', 780 + (rng() - 0.5) * 140),
            metric(rng, 'open-doc-warm · CLS', 0.01 + rng() * 0.015, 'cls'),
            metric(rng, 'open-doc-warm · main-thread blocking', 240 + (rng() - 0.5) * 60),
          ],
        },
        {
          scenario: 'singleString',
          sourceFile: 'perf/bench/scenarios/singleString.ts',
          kind: 'pageload',
          // INP (Core Web Vital) from the dedicated interaction-mix run. It
          // worsens on the same day the boot regression lands (day 70), and
          // the interaction count sits above the 50-interaction reportable
          // threshold so the "confidence context" row reads as healthy.
          metrics: [
            metric(rng, 'INP', day < 70 ? 180 : 260),
            metric(rng, 'INP interactions', 60 + Math.round((rng() - 0.5) * 6), 'count'),
          ],
        },
        {
          scenario: 'singleString',
          sourceFile: 'perf/bench/scenarios/singleString.ts',
          kind: 'interaction',
          metrics: [],
          // Soak: main leaks heap slowly (worse after day 40); perf-bench
          // instead grows listeners a little each minute (a subscription that
          // isn't torn down) while heap stays flat — so each branch demos a
          // different leak shape, and no series is pure noise
          soak: {
            minutes: 10,
            samples: Array.from({length: 11}, (_, minute) => {
              const heapPerMin = branch === 'main' ? (day < 40 ? 0.4 : 1.6) : 0.2
              const listenerPerMin = branch === 'main' ? 0 : 3
              return {
                minute,
                heapMb: 80 + minute * heapPerMin + (rng() - 0.5),
                domNodes: Math.round(4200 + minute * (day < 40 ? 2 : 12) + (rng() - 0.5) * 4),
                listeners: Math.round(910 + minute * listenerPerMin + (rng() - 0.5) * 2),
                latencyP50Ms: 24 + minute * (day < 40 ? 0 : 0.6) + (rng() - 0.5),
                cpuTaskMs: minute === 0 ? null : Math.round(34000 + (rng() - 0.5) * 2000),
                connections: 9,
                requests: minute === 0 ? 0 : Math.round(230 + (rng() - 0.5) * 20),
              }
            }),
          },
        },
        // Settle mode (render-loop detector), 4 sessions per scenario. The
        // 'sessions not settled' count is the tripwire series: flat zero on
        // healthy scenarios, a constant 4 on red-by-design ones. previewHeavy
        // re-regresses at day 75 — every session loops, so 'time to settle'
        // (settled sessions only) drops out and the commit count explodes.
        ...settleScenarios(rng, day),
      ],
    })
  }
  return runs
}

/**
 * Synthetic release tags spanning the same 90 days the demo runs cover, so the
 * release markers are exercisable offline like every other layer.
 *
 * Deliberately awkward: the cadence is uneven and one pair lands two days apart
 * so label collision handling actually gets hit rather than only appearing
 * against live data.
 *
 * All main-line tags, like the live query returns — `TAGS_QUERY` excludes
 * releases cut off main, so synthetic maintenance-branch tags here would model a
 * case the charts never actually receive. The major still steps (6 → 7) so the
 * cutover a long-range chart spans is represented.
 */
export function generateDebugTags(source: DebugSource): TrendTag[] {
  if (source === 'empty') return []
  const start = Date.now() - DAYS * DAY_MS
  const tagAt = (day: number) =>
    // Mid-morning, so a marker never coincides exactly with a run's timestamp
    new Date(start + day * DAY_MS + 10 * 60 * 60 * 1000).toISOString()

  // `single-run` plots one run, so its domain is a two-day pad around the last
  // day of the window — the 90-day schedule below falls entirely outside it.
  // One tag on that day instead, so the case exercises "marker on a lone run"
  // rather than looking like markers are broken.
  if (source === 'single-run') {
    return [{tag: 'v6.11.0', taggedAt: tagAt(DAYS - 1), major: 6, distTags: ['latest']}]
  }

  // The newest tag is what npm serves as `latest` — its label says so
  const latestDay = RELEASE_SCHEDULE.at(-1)?.day
  return RELEASE_SCHEDULE.map((entry) => ({
    tag: versionOf(entry),
    taggedAt: tagAt(entry.day),
    major: entry.major,
    distTags: entry.day === latestDay ? ['latest'] : null,
  }))
}

export function generateDebugRuns(source: DebugSource): TrendRun[] {
  // Two branches so the branch filter / comparison is exercisable; perf-bench
  // runs ~4ms faster on the steady metric
  const demo = [...generateDemo('main', 0), ...generateDemo('perf-bench', -4)]
  switch (source) {
    case 'demo':
      return demo
    case 'sparse':
      return demo.filter((_, index) => index % 7 === 0)
    case 'single-run':
      return demo.filter((run) => run.git?.branch === 'main').slice(-1)
    case 'empty':
      return []
    default:
      return source satisfies never
  }
}
