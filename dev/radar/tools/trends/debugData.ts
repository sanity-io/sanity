/// <reference types="vite/client" />
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
import {
  addMutantCounts,
  CATALOGUE_SUITE_IDS,
  type CatalogueEntryResult,
  type CatalogueSuiteId,
  type CatalogueSuiteStatus,
  coveredMutationScoreOf,
  emptyMutantCounts,
  ENGINE_CONFIDENCE_RUN_TYPE,
  ENGINE_CONFIDENCE_SCHEMA_VERSION,
  type EngineConfidenceRunDocument,
  type EngineConfidenceScore,
  isEntryCaught,
  isoWeekOf,
  isoWeekStart,
  type KnownBugsSummary,
  type MutantCounts,
  type MutatedFileResult,
  mutationScoreOf,
  STRYKER_TARGET_IDS,
  type StrykerTargetId,
  type StrykerTargetRun,
  STUDIO_ENGINE_TARGET,
  targetScoreOf,
} from '@repo/utils/engine-confidence'
import {engineConfidenceRunId} from '@repo/utils/radar-ids'

import {type TrendRun, type TrendTag} from './data'

/** mulberry32 — same tiny PRNG the bench fixtures use. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEBUG_SOURCES = [
  'demo',
  'sparse',
  'single-run',
  'empty',
  'sqrl',
  'sqrl-climb',
  'sqrl-regressed',
  'sqrl-empty',
] as const
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
  unit: 'ms' | 'count' | 'cls' | 'bytes' | 'percent' = 'ms',
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

/** The day the demo's build starts shipping @sanity/ui v5 — earlier runs record no adoption rows. */
const UI5_ARRIVES_DAY = 10

/**
 * The style-migration rows of one scenario page (see STYLE_METRICS in
 * @repo/utils/style-systems), telling the migration story the tab exists to
 * show: no @sanity/ui v5 in the build for the first ten days (the rows are
 * absent, never 0%), then an S-curve of adoption climbing past 60% as the v4
 * count falls by the same amount, while the styled-components escape hatch
 * — instances, components, inserted CSS — shrinks week over week. A
 * styled-components version bump lands at day 60 so the version context has
 * something to show. `scale` sizes the page (an article renders more than a
 * single string field); the base magnitudes are a local bench run of
 * singleString (900 @sanity/ui nodes, 98 styled nodes, ~950 inserted rules).
 */
function styleRows(
  rng: () => number,
  day: number,
  scale: number,
): {metrics: NonNullable<DemoScenario['metrics']>; styles: DemoScenario['styles']} {
  const ui5Available = day >= UI5_ARRIVES_DAY
  const uiTotal = Math.round(900 * scale)
  // Logistic adoption: ~3% on arrival, 50% around day 55, flattening near 65%
  const adoption = ui5Available ? 0.65 / (1 + Math.exp(-(day - 55) / 9)) : 0
  const ui5 = Math.round(uiTotal * adoption)
  const ui4 = uiTotal - ui5
  const progress = ui5Available ? (day - UI5_ARRIVES_DAY) / (DAYS - UI5_ARRIVES_DAY) : 0
  // The escape hatch shrinks roughly linearly as components migrate
  const styledInstances = Math.round((98 - 45 * progress) * scale + (rng() - 0.5) * 2)
  const styledComponents = Math.round((50 - 22 * progress) * scale)
  const cssRules = Math.round(950 - 480 * progress)
  const totalRules = 2050 - 250 * progress
  const cssBytes = Math.round(648_000 - 330_000 * progress)
  const version = day < 60 ? '6.1.15' : '6.5.3'
  return {
    metrics: [
      ...(ui5Available
        ? [
            metric(rng, 'UI v5 share', (ui5 / uiTotal) * 100, 'percent'),
            metric(rng, 'UI v5 instances', ui5, 'count'),
          ]
        : []),
      metric(rng, 'UI v4 instances', ui4, 'count'),
      metric(rng, 'styled-components instances', styledInstances, 'count'),
      metric(rng, 'styled-components components', styledComponents, 'count'),
      metric(rng, 'styled-components CSS rules', cssRules, 'count'),
      metric(rng, 'styled-components CSS bytes', cssBytes, 'bytes'),
      metric(rng, 'styled-components CSS rule share', (cssRules / totalRules) * 100, 'percent'),
      metric(rng, 'styled-components style tags', 1, 'count'),
      // CSS weight: the inserted CSS plus a static stylesheet that grows a
      // little as components move to it (fewer bytes per rule than runtime CSS)
      metric(rng, 'CSS bytes', cssBytes + Math.round(420_000 + 90_000 * progress), 'bytes'),
      metric(rng, 'CSS rules', cssRules + Math.round(1500 + 260 * progress), 'count'),
      metric(rng, 'style tag CSS bytes', cssBytes, 'bytes'),
      metric(rng, 'style tag CSS rules', cssRules, 'count'),
    ],
    styles: {
      experiment: {
        ui5Available,
        styledComponentsVersion: version,
        readableCssRules: Math.round(totalRules),
      },
    },
  }
}

/** Append the style rows to a scenario's own metrics. */
function withStyleRows(
  scenario: DemoScenario,
  rng: () => number,
  day: number,
  scale: number,
): DemoScenario {
  const rows = styleRows(rng, day, scale)
  return {...scenario, metrics: [...(scenario.metrics ?? []), ...rows.metrics], styles: rows.styles}
}

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
        // Every scenario that opens a document carries the style census rows
        // (interaction and pageload shards of one scenario count the same
        // page, so their rows merge into one series per scenario — see
        // buildSeries)
        withStyleRows(
          {
            scenario: 'singleString',
            sourceFile: 'perf/bench/scenarios/singleString.ts',
            kind: 'interaction',
            metrics: [metric(rng, 'stringField', 32 + shift)], // steady (branch offset)
          },
          rng,
          day,
          1,
        ),
        withStyleRows(
          {
            scenario: 'article',
            sourceFile: 'perf/bench/scenarios/article.ts',
            kind: 'interaction',
            metrics: [
              metric(rng, 'title', 30 + day * 0.09), // slow drift up
              metric(rng, 'body', day < 60 ? 36 : 44), // step regression at day 60
            ],
          },
          rng,
          day,
          1.6,
        ),
        withStyleRows(
          {
            scenario: 'recipe',
            sourceFile: 'perf/bench/scenarios/recipe.ts',
            kind: 'interaction',
            metrics: [metric(rng, 'name', day < 45 ? 40 : 33)], // improvement at day 45
          },
          rng,
          day,
          1.3,
        ),
        withStyleRows(
          {
            scenario: 'synthetic',
            sourceFile: 'perf/bench/scenarios/synthetic.ts',
            kind: 'interaction',
            // Tracks host speed — read against the calibration strip
            metrics: [metric(rng, 'title', 34 * hostFactor)],
          },
          rng,
          day,
          2.2,
        ),
        withStyleRows(
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
          rng,
          day,
          1,
        ),
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
    case 'sqrl':
    case 'sqrl-climb':
    case 'sqrl-regressed':
    case 'sqrl-empty':
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

const ENGINE_DEMO_WEEKS = 20
const ENGINE_CONFIG_BREAK_WEEK = 12
const WEEK_MS = 7 * DAY_MS
const THURSDAY_RUN_OFFSET_MS = 3 * DAY_MS + 3 * 60 * 60 * 1000

type EngineFileSeed = [
  path: string,
  target: StrykerTargetId,
  detected: number,
  survived: number,
  noCoverage: number,
]

const SANITY_ROOT = 'packages/sanity/src/core/'
const MUTATOR_ROOT = 'packages/@sanity/mutator/src/'

/** Per-file mutant counts from the Stryker tier 1 sizing run, trimmed to the files worth a row. */
const ENGINE_FILE_SEEDS: EngineFileSeed[] = [
  [`${SANITY_ROOT}form/patch/PatchChannel.ts`, 'sanity', 0, 0, 16],
  [`${SANITY_ROOT}store/document/document-pair/consistencyStatus.ts`, 'sanity', 1, 2, 9],
  [`${SANITY_ROOT}store/document/document-pair/utils/actionsApiClient.ts`, 'sanity', 1, 5, 0],
  [`${SANITY_ROOT}store/document/document-pair/utils/operationsApiClient.ts`, 'sanity', 1, 3, 0],
  [`${SANITY_ROOT}store/document/document-pair/operationEvents.ts`, 'sanity', 19, 34, 7],
  [`${SANITY_ROOT}store/document/document-pair/utils/isLiveEditEnabled.ts`, 'sanity', 2, 4, 0],
  [`${MUTATOR_ROOT}document/BufferedDocument.ts`, 'mutator', 71, 66, 63],
  [`${MUTATOR_ROOT}document/Document.ts`, 'mutator', 129, 102, 54],
  [`${SANITY_ROOT}store/document/document-pair/editOperations.ts`, 'sanity', 8, 8, 1],
  [`${MUTATOR_ROOT}patch/InsertPatch.ts`, 'mutator', 22, 16, 5],
  [`${MUTATOR_ROOT}patch/IncPatch.ts`, 'mutator', 21, 8, 5],
  [`${SANITY_ROOT}store/document/utils/sequentializeListenerEvents.ts`, 'sanity', 70, 39, 4],
  [`${SANITY_ROOT}store/document/utils/dedupeListenerEvents.ts`, 'sanity', 15, 5, 4],
  [`${SANITY_ROOT}store/document/document-pair/operations/helpers.ts`, 'sanity', 55, 32, 0],
  [`${MUTATOR_ROOT}patch/ImmutableAccessor.ts`, 'mutator', 91, 25, 28],
  [
    `${SANITY_ROOT}store/document/buffered-doc/createObservableBufferedDocument.ts`,
    'sanity',
    63,
    31,
    4,
  ],
  [`${SANITY_ROOT}store/document/getPairListener.ts`, 'sanity', 144, 57, 8],
  [`${MUTATOR_ROOT}patch/Patcher.ts`, 'mutator', 58, 17, 7],
  [`${MUTATOR_ROOT}jsonpath/Expression.ts`, 'mutator', 278, 59, 42],
  [`${MUTATOR_ROOT}document/Mutation.ts`, 'mutator', 93, 16, 17],
  [`${SANITY_ROOT}form/patch/string.ts`, 'sanity', 18, 5, 1],
  [`${MUTATOR_ROOT}jsonpath/PlainProbe.ts`, 'mutator', 43, 5, 9],
  [`${SANITY_ROOT}form/utils/path.ts`, 'sanity', 68, 22, 0],
  [`${MUTATOR_ROOT}jsonpath/Descender.ts`, 'mutator', 79, 15, 10],
  [`${SANITY_ROOT}store/document/document-pair/checkoutPair.ts`, 'sanity', 261, 75, 5],
  [`${MUTATOR_ROOT}jsonpath/Matcher.ts`, 'mutator', 112, 17, 13],
  [`${MUTATOR_ROOT}jsonpath/toPath.ts`, 'mutator', 79, 11, 10],
  [`${MUTATOR_ROOT}document/SquashingBuffer.ts`, 'mutator', 131, 29, 5],
  [`${MUTATOR_ROOT}jsonpath/parse.ts`, 'mutator', 262, 37, 26],
  [`${MUTATOR_ROOT}jsonpath/tokenize.ts`, 'mutator', 183, 25, 11],
  [`${SANITY_ROOT}form/patch/applyPatch.ts`, 'sanity', 130, 11, 11],
  [`${SANITY_ROOT}form/utils/mutationPatch.ts`, 'sanity', 106, 0, 1],
]

interface DemoCatalogueEntry {
  id: string
  title: string
  severity: CatalogueEntryResult['severity']
  failureClass: string
  sourceUrl?: string
  addedWeek: number
  /** Suite statuses; a function so an entry can start being caught part-way through the history. */
  statuses: (week: number) => Record<CatalogueSuiteId, CatalogueSuiteStatus>
}

const DEMO_CATALOGUE: DemoCatalogueEntry[] = [
  {
    id: 'ENG-001',
    title: 'Keyed Portable Text block deletion escalated to a whole-field unset',
    severity: 'S1',
    failureClass: 'form layer rewrites a patch from a lagging copy of the value',
    sourceUrl: 'https://github.com/sanity-io/sanity/pull/14747',
    addedWeek: 0,
    statuses: () => ({
      'unit:mutator': 'not-applicable',
      'unit:engine': 'caught',
      'fuzz:pt': 'caught',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-002',
    title: 'A retryable commit failure drops the commit instead of re-queuing it',
    severity: 'S1',
    failureClass: 'transient commit failure treated as terminal',
    addedWeek: 0,
    statuses: () => ({
      'unit:mutator': 'missed',
      'unit:engine': 'caught',
      'fuzz:pt': 'not-applicable',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-003',
    title: 'A remote mutation arriving over buffered local edits skips the rebase',
    severity: 'S1',
    failureClass: 'rebase skipped when a remote mutation lands on pending local edits',
    addedWeek: 0,
    statuses: () => ({
      'unit:mutator': 'caught',
      'unit:engine': 'caught',
      'fuzz:pt': 'missed',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-004',
    title: 'Listener dedupe drops the second document event of a multi-document transaction',
    severity: 'S2',
    failureClass: 'listener dedupe drops a real event',
    addedWeek: 0,
    statuses: () => ({
      'unit:mutator': 'not-applicable',
      'unit:engine': 'caught',
      'fuzz:pt': 'not-applicable',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-005',
    title: 'Autocommit throttle loses its trailing commit',
    severity: 'S1',
    failureClass: 'lost edit when switching documents shortly after typing',
    sourceUrl: 'https://github.com/sanity-io/sanity/issues/15261',
    addedWeek: 0,
    statuses: (week) => ({
      'unit:mutator': 'not-applicable',
      'unit:engine': week >= 15 ? 'caught' : 'missed',
      'fuzz:pt': 'not-applicable',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-006',
    title: 'Demo entry: a reconnect replays an already-applied optimistic patch',
    severity: 'S2',
    failureClass: 'duplicate application after a listener reconnect',
    addedWeek: 6,
    statuses: () => ({
      'unit:mutator': 'not-applicable',
      'unit:engine': 'caught',
      'fuzz:pt': 'not-applicable',
      'e2e': 'not-run',
    }),
  },
  {
    id: 'ENG-007',
    title: 'Demo entry: a squashed patch loses its key on array reorder',
    severity: 'S2',
    failureClass: 'patch squashing rewrites keyed paths',
    addedWeek: 10,
    statuses: () => ({
      'unit:mutator': 'missed',
      'unit:engine': 'missed',
      'fuzz:pt': 'missed',
      'e2e': 'not-run',
    }),
  },
]

/** Scores climb, with one flat stretch (weeks 7 to 10) and a small step down when the config changes. */
function engineScoreShift(week: number): number {
  const effectiveWeek = week < 7 ? week : week <= 10 ? 7 : week - 3
  const progress = effectiveWeek / 16
  return -0.005 + 0.2 * progress + (week >= ENGINE_CONFIG_BREAK_WEEK ? -0.03 : 0)
}

function shiftedFileCounts(seed: EngineFileSeed, shift: number): MutantCounts {
  const [, , detected, survived, noCoverage] = seed
  const base = emptyMutantCounts()
  if (shift >= 0) {
    const recovered = Math.round((survived + noCoverage) * shift)
    const fromSurvived = Math.min(survived, recovered)
    return withReviewCounts({
      ...base,
      killed: detected + recovered,
      survived: survived - fromSurvived,
      noCoverage: noCoverage - (recovered - fromSurvived),
    })
  }
  const lost = Math.round(detected * -shift)
  return withReviewCounts({...base, killed: detected - lost, survived: survived + lost, noCoverage})
}

/** Adds mutants outside the score, so the demo ratios do not depend on them. */
function withReviewCounts(counts: MutantCounts): MutantCounts {
  return {
    ...counts,
    excluded: Math.floor(counts.survived * 0.25),
    ignored: Math.floor(counts.killed * 0.04),
  }
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function hexString(rng: () => number, length: number): string {
  return Array.from({length}, () => '0123456789abcdef'[Math.floor(rng() * 16)]).join('')
}

function demoMutatedFiles(shift: number): MutatedFileResult[] {
  return ENGINE_FILE_SEEDS.map((seed, index) => ({
    _key: `file-${index}`,
    path: seed[0],
    target: seed[1],
    counts: shiftedFileCounts(seed, shift),
  }))
}

function sumCounts(files: MutatedFileResult[]): MutantCounts {
  return files.reduce((total, file) => addMutantCounts(total, file.counts), emptyMutantCounts())
}

function demoStrykerTargets(options: {
  week: number
  configVersion: number
  files: MutatedFileResult[]
}): StrykerTargetRun[] {
  const {week, configVersion, files} = options
  const full = week % 4 === 0
  return STRYKER_TARGET_IDS.map((target, index) => {
    const targetCounts = sumCounts(files.filter((file) => file.target === target))
    const mutants = Object.values(targetCounts).reduce((total, count) => total + count, 0)
    return {
      _key: `target-${index}`,
      target,
      mode: full ? 'full' : 'incremental',
      reusedMutants: full ? 0 : mutants - 12 - ((week * (index + 3)) % 17),
      dryRunTests: target === 'sanity' ? 391 + (configVersion - 1) * 10 : 298,
      durationMs: full ? (target === 'sanity' ? 428_000 : 97_000) : 41_000 + week * 600,
    }
  })
}

function demoCatalogueEntries(week: number, addedOn: string): CatalogueEntryResult[] {
  return DEMO_CATALOGUE.filter((entry) => entry.addedWeek <= week).map((entry, entryIndex) => {
    const statuses = entry.statuses(week)
    return {
      _key: `entry-${entryIndex}`,
      id: entry.id,
      title: entry.title,
      severity: entry.severity,
      failureClass: entry.failureClass,
      ...(entry.sourceUrl ? {sourceUrl: entry.sourceUrl} : {}),
      addedOn,
      results: CATALOGUE_SUITE_IDS.map((suite, suiteIndex) => ({
        _key: `suite-${suiteIndex}`,
        suite,
        status: statuses[suite],
      })),
    }
  })
}

function demoEngineScore(
  week: number,
  configVersion: number,
  files: MutatedFileResult[],
): EngineConfidenceScore {
  const counts = sumCounts(files)
  const ratio = mutationScoreOf(counts)
  const coveredRatio = coveredMutationScoreOf(counts)
  return ratio === undefined
    ? {status: 'not-measured', reason: 'No mutants were scored'}
    : {
        status: 'measured',
        ratio,
        ...(coveredRatio === undefined ? {} : {coveredRatio}),
        counts,
        targets: demoStrykerTargets({week, configVersion, files}),
        files,
      }
}

function demoKnownBugs(entries: CatalogueEntryResult[]): KnownBugsSummary {
  return entries.length === 0
    ? {status: 'not-measured', reason: 'The catalogue has no active entries'}
    : {
        status: 'measured',
        activeEntries: entries.length,
        caughtEntries: entries.filter(isEntryCaught).length,
        entries,
      }
}

function demoEngineRun(week: number, weekStart: Date): EngineConfidenceRunDocument {
  const rng = mulberry32(4000 + week)
  const configVersion = week >= ENGINE_CONFIG_BREAK_WEEK ? 2 : 1
  const startedAt = new Date(weekStart.getTime() + THURSDAY_RUN_OFFSET_MS)
  const isoWeek = isoWeekOf(startedAt)
  const files = demoMutatedFiles(engineScoreShift(week))
  const score = demoEngineScore(week, configVersion, files)
  const knownBugs = demoKnownBugs(demoCatalogueEntries(week, isoDate(startedAt)))
  return {
    _id: engineConfidenceRunId(isoWeek),
    _type: ENGINE_CONFIDENCE_RUN_TYPE,
    schemaVersion: ENGINE_CONFIDENCE_SCHEMA_VERSION,
    isoWeek,
    trigger: 'schedule',
    startedAt: startedAt.toISOString(),
    completedAt: new Date(startedAt.getTime() + 55 * 60 * 1000).toISOString(),
    git: {
      sha: hexString(rng, 40),
      branch: 'main',
      committedAt: new Date(startedAt.getTime() - DAY_MS).toISOString(),
    },
    runner: {
      os: 'linux',
      arch: 'x64',
      cpus: 4,
      memGb: 16,
      nodeVersion: 'v24.16.0',
      cpuModel: 'AMD EPYC 7763 64-Core Processor',
      imageOs: 'ubuntu24',
      imageVersion: '20260901.1',
      ci: true,
      runId: String(9_000_000_000 + week),
      runAttempt: 1,
    },
    config: {
      version: configVersion,
      hash: hexString(mulberry32(configVersion), 64),
      strykerVersion: '10.0.0',
      vitestVersion: '5.0.4',
      timeoutMs: 60_000,
      concurrency: 4,
      fuzzSeeds: [1, 2, 3],
      fuzzRuns: 150,
    },
    score,
    studioScore: targetScoreOf(files, STUDIO_ENGINE_TARGET),
    knownBugs,
  }
}

/** The newest week whose Thursday run has already happened, so the demo never shows a future run. */
function newestDemoWeekStart(now: Date): Date {
  const currentWeekStart = isoWeekStart(isoWeekOf(now))
  const thursdayRun = currentWeekStart.getTime() + THURSDAY_RUN_OFFSET_MS
  return new Date(
    thursdayRun <= now.getTime()
      ? currentWeekStart.getTime()
      : currentWeekStart.getTime() - WEEK_MS,
  )
}

function isEngineConfidenceRun(value: unknown): value is EngineConfidenceRunDocument {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<EngineConfidenceRunDocument>
  return (
    candidate._type === ENGINE_CONFIDENCE_RUN_TYPE &&
    candidate.schemaVersion === ENGINE_CONFIDENCE_SCHEMA_VERSION &&
    typeof candidate.score === 'object'
  )
}

const LOCAL_ENGINE_RUN_MODULES = import.meta.glob('./__local__/*.json', {
  eager: true,
  import: 'default',
})

/** A real run dropped into `__local__/` (gitignored); the last file by name wins. */
function localEngineRun(): EngineConfidenceRunDocument | undefined {
  const latestPath = Object.keys(LOCAL_ENGINE_RUN_MODULES).toSorted().at(-1)
  const candidate = latestPath === undefined ? undefined : LOCAL_ENGINE_RUN_MODULES[latestPath]
  return isEngineConfidenceRun(candidate) ? candidate : undefined
}

/**
 * The real run stands in for the newest generated week, relabelled to that
 * week and config version so the demo timeline stays consistent: a real run
 * from another week or config would otherwise draw a phantom gap or break.
 */
function withLocalRun(
  runs: EngineConfidenceRunDocument[],
  local: EngineConfidenceRunDocument | undefined,
): EngineConfidenceRunDocument[] {
  const newest = runs.at(-1)
  if (local === undefined || newest === undefined) return runs
  return [
    ...runs.slice(0, -1),
    {
      ...local,
      _id: newest._id,
      isoWeek: newest.isoWeek,
      startedAt: newest.startedAt,
      completedAt: newest.completedAt,
      config: {...local.config, version: newest.config.version},
    },
  ]
}

const SPARSE_ENGINE_WEEKS = [14, 15, 18, 19]

/**
 * Synthetic weekly Engine confidence runs, typed against the stored document so
 * every one is a valid `engineConfidenceRun`. Deterministic for a given `now`.
 */
export function generateDebugEngineConfidenceRuns(
  source: DebugSource,
  now: Date = new Date(),
): EngineConfidenceRunDocument[] {
  if (source === 'empty') return []
  const newestStart = newestDemoWeekStart(now).getTime()
  const weeks = Array.from({length: ENGINE_DEMO_WEEKS}, (_, week) =>
    demoEngineRun(week, new Date(newestStart - (ENGINE_DEMO_WEEKS - 1 - week) * WEEK_MS)),
  )
  switch (source) {
    case 'demo':
      return withLocalRun(weeks, localEngineRun())
    case 'sqrl':
    case 'sqrl-climb':
    case 'sqrl-regressed':
    case 'sqrl-empty':
      return weeks
    case 'sparse':
      return SPARSE_ENGINE_WEEKS.map((week) => weeks[week])
    case 'single-run':
      return weeks.slice(-1)
    default:
      return source satisfies never
  }
}
