/**
 * SQRL inputs: what each one reads from a projected `benchRun` and the frozen
 * constants of formula version 1. The derivation and the measurements behind
 * every constant are in SPEC.md, "SQRL score".
 */

export type SqrlPillarKey = 'inp' | 'responsiveness' | 'load' | 'cpu' | 'memory' | 'reliability'

export type SqrlUnit = 'ms' | 'bytes' | 'count' | 'cls' | 'megabytes' | 'perMinute' | 'events'

type ResourceKey =
  | 'cpuTaskMs'
  | 'cpuScriptMs'
  | 'heapMb'
  | 'domNodes'
  | 'listeners'
  | 'requestCount'

type SoakSampleKey = 'heapMb' | 'domNodes' | 'listeners'

export interface SqrlSoak {
  settleMinute?: number | null
  samples?: ({minute: number} & Partial<Record<SoakSampleKey, number | null>>)[] | null
}

export interface SqrlScenario {
  scenario: string
  kind: string
  mode?: string | null
  calibrationMs?: number | null
  metrics?: {label: string; median?: number | null; p75?: number | null}[] | null
  resources?: Partial<Record<ResourceKey, number | null>> | null
  soak?: SqrlSoak | null
}

export interface SqrlRun {
  _id: string
  startedAt: string
  git: {sha: string; committedAt?: string | null}
  runner?: {calibrationMs?: number | null; cpuModel?: string | null} | null
  totalJsBytes?: number | null
  scenarios?: SqrlScenario[] | null
}

export interface SqrlPart {
  value: number
  calibrationMs: number | null
  epsilon: number
}

export interface SqrlInputDefinition {
  key: string
  label: string
  pillar: Exclude<SqrlPillarKey, 'reliability'>
  unit: SqrlUnit
  /** Host-calibration exponent: value × (REFERENCE_CALIBRATION_MS / calibrationMs)^beta. */
  beta: number
  extract: (run: SqrlRun) => SqrlPart[] | null
}

export const FORMULA_VERSION = 1
export const REFERENCE_CALIBRATION_MS = 7
/** Rolling-median length and reference-window length, in commits. */
export const COMMIT_WINDOW = 7
export const INP_PILLAR_WEIGHT = 0.35
export const RELIABILITY_KEY = 'reliability'
export const RELIABILITY_WINDOW_WEEKS = 13

const CLS_EPSILON = 0.01
const COMMITS_EPSILON = 1
const SOAK_GROWTH_FIRST_MINUTE = 2

/**
 * Frozen for formula version 1 so history never shifts as runs accumulate:
 * k for soak heap growth is max(same-sha re-run sigma, 1% of the median
 * end-of-run heap per soak minute), and the fitted betas are the within-sha
 * re-run log-log slopes clamped to [0, 1.5], all measured on the 150 main runs
 * up to 2026-10-15.
 */
const SOAK_HEAP_GROWTH_EPSILON = 0.10949710315080215
/** The same k rule over 5 re-runs of the article soak (2026-10-16 branch dispatch): re-run sigma wins for heap, 1% of the end-of-run level for listeners and DOM nodes. */
const ARTICLE_SOAK_HEAP_GROWTH_EPSILON = 0.9053638951766163
const ARTICLE_SOAK_LISTENER_GROWTH_EPSILON = 3.103
const ARTICLE_SOAK_DOM_GROWTH_EPSILON = 8.077
export const FITTED_BETAS = {
  fcp: 0.6182903360675802,
  lcp: 0.766706973542303,
  mainThreadBlocking: 1.5,
  cpuTask: 0.9895357929710796,
  cpuScript: 1.014066341387465,
  settleCpu: 1.5,
} as const

const KEYSTROKE_FIELDS: [scenario: string, label: string][] = [
  ['singleString', 'stringField'],
  ['arrayI18n', 'simple-en'],
  ['article', 'title'],
  ['article', 'body'],
  ['synthetic', 'title'],
]
const RESOURCE_SCENARIOS = ['arrayI18n', 'article', 'recipe', 'singleString', 'synthetic']
/** The settle scenarios expected to settle: documentActions and listenQueryPane are red by design, debugLoop is the detector's self-test. */
const SETTLE_SCENARIOS = [
  'singleString',
  'article',
  'previewHeavy',
  'customInputs',
  'wrappedForm',
  'structurePane',
]

function metricPart(
  run: SqrlRun,
  scenario: string,
  kind: string,
  mode: string | null,
  label: string,
  field: 'median' | 'p75',
): SqrlPart | null {
  const entries = (run.scenarios ?? []).filter(
    (entry) => entry.scenario === scenario && entry.kind === kind && (entry.mode ?? null) === mode,
  )
  const parts = entries.flatMap((entry) =>
    (entry.metrics ?? []).flatMap((metric) => {
      const value = metric[field]
      return metric.label === label && typeof value === 'number'
        ? [{value, calibrationMs: entry.calibrationMs ?? null, epsilon: 0}]
        : []
    }),
  )
  return parts[0] ?? null
}

function allOrNothing(parts: (SqrlPart | null)[]): SqrlPart[] | null {
  const measured = parts.filter((part): part is SqrlPart => part !== null)
  return measured.length === parts.length ? measured : null
}

function metricInput(
  scenarios: string[],
  kind: string,
  mode: string | null,
  label: string,
  epsilon = 0,
): (run: SqrlRun) => SqrlPart[] | null {
  return (run) =>
    allOrNothing(
      scenarios.map((scenario) => {
        const part = metricPart(run, scenario, kind, mode, label, 'median')
        return part ? {...part, epsilon} : null
      }),
    )
}

function keystrokeInput(field: 'median' | 'p75'): (run: SqrlRun) => SqrlPart[] | null {
  return (run) =>
    allOrNothing(
      KEYSTROKE_FIELDS.map(([scenario, label]) =>
        metricPart(run, scenario, 'interaction', null, label, field),
      ),
    )
}

function resourceEntry(run: SqrlRun, scenario: string): SqrlScenario | undefined {
  return (run.scenarios ?? []).findLast(
    (entry) =>
      entry.scenario === scenario &&
      entry.kind === 'interaction' &&
      (entry.mode ?? null) === null &&
      Boolean(entry.resources),
  )
}

function resourceInput(key: ResourceKey): (run: SqrlRun) => SqrlPart[] | null {
  return (run) =>
    allOrNothing(
      RESOURCE_SCENARIOS.map((scenario) => {
        const entry = resourceEntry(run, scenario)
        const value = entry?.resources?.[key]
        return typeof value === 'number' && value !== 0
          ? {value, calibrationMs: entry?.calibrationMs ?? null, epsilon: 0}
          : null
      }),
    )
}

function totalJsInput(run: SqrlRun): SqrlPart[] | null {
  return run.totalJsBytes ? [{value: run.totalJsBytes, calibrationMs: null, epsilon: 0}] : null
}

/** Least-squares slope per minute, as `slopePerMinute` in tools/trends/data.ts, from `firstMinute` on. */
export function slopePerMinute(
  samples: {minute: number; value: number | null | undefined}[],
  firstMinute: number,
): number {
  const pairs = samples.filter(
    (sample): sample is {minute: number; value: number} =>
      sample.minute >= firstMinute && typeof sample.value === 'number',
  )
  if (pairs.length < 2) return 0
  const count = pairs.length
  const sumX = pairs.reduce((total, pair) => total + pair.minute, 0)
  const sumY = pairs.reduce((total, pair) => total + pair.value, 0)
  const sumXY = pairs.reduce((total, pair) => total + pair.minute * pair.value, 0)
  const sumXX = pairs.reduce((total, pair) => total + pair.minute * pair.minute, 0)
  const denominator = count * sumXX - sumX * sumX
  return denominator === 0 ? 0 : (count * sumXY - sumX * sumY) / denominator
}

function soakGrowthInput(
  scenario: string,
  key: SoakSampleKey,
  epsilon: number,
  firstMinute: (soak: SqrlSoak) => number,
): (run: SqrlRun) => SqrlPart[] | null {
  return (run) => {
    // By name: runs can carry several soaks, in no fixed order
    const soak =
      (run.scenarios ?? []).find(
        (entry) => entry.scenario === scenario && Array.isArray(entry.soak?.samples),
      )?.soak ?? null
    const samples = soak?.samples ?? []
    if (soak === null || samples.length === 0) return null
    const slope = slopePerMinute(
      samples.map((sample) => ({minute: sample.minute, value: sample[key]})),
      firstMinute(soak),
    )
    // Shrinking earns no credit: the floor keeps a negative slope from reading as an improvement
    return [{value: Math.max(slope, 0), calibrationMs: null, epsilon}]
  }
}

// Fixed minutes 2-10 for formula v1, whatever settleMinute a soak report declares
const fixedFirstMinute = () => SOAK_GROWTH_FIRST_MINUTE
const declaredFirstMinute = (soak: SqrlSoak) => soak.settleMinute ?? SOAK_GROWTH_FIRST_MINUTE

function singleString(
  kind: string,
  label: string,
  epsilon = 0,
): (run: SqrlRun) => SqrlPart[] | null {
  return metricInput(['singleString'], kind, null, label, epsilon)
}

export const MEMORY_ADDITION_KEYS = ['soakHeapGrowth', 'requestCount'] as const

export const SQRL_INPUTS: readonly SqrlInputDefinition[] = [
  {
    key: 'articleInp',
    label: 'INP, article',
    pillar: 'inp',
    unit: 'ms',
    beta: 1,
    extract: metricInput(['article'], 'pageload', 'inp', 'INP'),
  },
  {
    key: 'singleStringInp',
    label: 'INP, singleString',
    pillar: 'inp',
    unit: 'ms',
    beta: 1,
    extract: metricInput(['singleString'], 'pageload', 'inp', 'INP'),
  },
  {
    key: 'keystrokeMedian',
    label: 'Keystroke latency, median (5 fields)',
    pillar: 'responsiveness',
    unit: 'ms',
    beta: 1.2,
    extract: keystrokeInput('median'),
  },
  {
    key: 'keystrokeP75',
    label: 'Keystroke latency, p75 (5 fields)',
    pillar: 'responsiveness',
    unit: 'ms',
    beta: 1.2,
    extract: keystrokeInput('p75'),
  },
  {
    key: 'timeToEditableCold',
    label: 'Time to editable, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: 0.85,
    extract: singleString('pageload', 'boot-cold · time to editable'),
  },
  {
    key: 'timeToEditableWarm',
    label: 'Time to editable, open-doc-warm',
    pillar: 'load',
    unit: 'ms',
    beta: 0.85,
    extract: singleString('pageload', 'open-doc-warm · time to editable'),
  },
  {
    key: 'toolVisible',
    label: 'Tool visible, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: 0.65,
    extract: metricInput(['toolReady'], 'pageload', null, 'boot-cold · tool visible'),
  },
  {
    key: 'loginClickable',
    label: 'Login clickable, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: 0.65,
    extract: metricInput(['loginReady'], 'pageload', null, 'boot-cold · login clickable'),
  },
  {
    key: 'fcp',
    label: 'FCP, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: FITTED_BETAS.fcp,
    extract: singleString('pageload', 'boot-cold · FCP'),
  },
  {
    key: 'lcp',
    label: 'LCP, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: FITTED_BETAS.lcp,
    extract: singleString('pageload', 'boot-cold · LCP'),
  },
  {
    key: 'mainThreadBlocking',
    label: 'Main-thread blocking, boot-cold',
    pillar: 'load',
    unit: 'ms',
    beta: FITTED_BETAS.mainThreadBlocking,
    extract: singleString('pageload', 'boot-cold · main-thread blocking'),
  },
  {
    key: 'cls',
    label: 'CLS, boot-cold (+0.01)',
    pillar: 'load',
    unit: 'cls',
    beta: 0,
    extract: singleString('pageload', 'boot-cold · CLS', CLS_EPSILON),
  },
  {
    key: 'cpuTask',
    label: 'CPU task time (5 interaction scenarios)',
    pillar: 'cpu',
    unit: 'ms',
    beta: FITTED_BETAS.cpuTask,
    extract: resourceInput('cpuTaskMs'),
  },
  {
    key: 'cpuScript',
    label: 'CPU script time (5 interaction scenarios)',
    pillar: 'cpu',
    unit: 'ms',
    beta: FITTED_BETAS.cpuScript,
    extract: resourceInput('cpuScriptMs'),
  },
  {
    key: 'settleCpu',
    label: 'Settle: CPU after ready (6 scenarios)',
    pillar: 'cpu',
    unit: 'ms',
    beta: FITTED_BETAS.settleCpu,
    extract: metricInput(SETTLE_SCENARIOS, 'pageload', 'settle', 'cpu after ready'),
  },
  {
    key: 'settleCommits',
    label: 'Settle: React commits after ready (6 scenarios, +1)',
    pillar: 'cpu',
    unit: 'count',
    beta: 0,
    extract: metricInput(
      SETTLE_SCENARIOS,
      'pageload',
      'settle',
      'react commits after ready',
      COMMITS_EPSILON,
    ),
  },
  {
    key: 'heap',
    label: 'Heap (5 interaction scenarios)',
    pillar: 'memory',
    unit: 'megabytes',
    beta: 0,
    extract: resourceInput('heapMb'),
  },
  {
    key: 'domNodes',
    label: 'DOM nodes (5 interaction scenarios)',
    pillar: 'memory',
    unit: 'count',
    beta: 0,
    extract: resourceInput('domNodes'),
  },
  {
    key: 'listeners',
    label: 'Event listeners (5 interaction scenarios)',
    pillar: 'memory',
    unit: 'count',
    beta: 0,
    extract: resourceInput('listeners'),
  },
  {
    key: 'bootJs',
    label: 'Boot JS, boot-cold',
    pillar: 'memory',
    unit: 'bytes',
    beta: 0,
    extract: singleString('pageload', 'boot-cold · boot JS'),
  },
  {
    key: 'totalJs',
    label: 'Total JS',
    pillar: 'memory',
    unit: 'bytes',
    beta: 0,
    extract: totalJsInput,
  },
  {
    key: 'pageCss',
    label: 'Page CSS bytes, singleString',
    pillar: 'memory',
    unit: 'bytes',
    beta: 0,
    extract: singleString('interaction', 'CSS bytes'),
  },
  {
    key: 'soakHeapGrowth',
    label: 'Soak heap growth, MB per minute (minutes 2-10, +k)',
    pillar: 'memory',
    unit: 'perMinute',
    beta: 0,
    extract: soakGrowthInput('singleString', 'heapMb', SOAK_HEAP_GROWTH_EPSILON, fixedFirstMinute),
  },
  {
    key: 'articleSoakHeapGrowth',
    label: 'Article soak heap growth, MB per minute (after settle, +k)',
    pillar: 'memory',
    unit: 'perMinute',
    beta: 0,
    extract: soakGrowthInput(
      'article',
      'heapMb',
      ARTICLE_SOAK_HEAP_GROWTH_EPSILON,
      declaredFirstMinute,
    ),
  },
  {
    key: 'articleSoakListenerGrowth',
    label: 'Article soak listener growth, per minute (after settle, +k)',
    pillar: 'memory',
    unit: 'perMinute',
    beta: 0,
    extract: soakGrowthInput(
      'article',
      'listeners',
      ARTICLE_SOAK_LISTENER_GROWTH_EPSILON,
      declaredFirstMinute,
    ),
  },
  {
    key: 'articleSoakDomGrowth',
    label: 'Article soak DOM node growth, per minute (after settle, +k)',
    pillar: 'memory',
    unit: 'perMinute',
    beta: 0,
    extract: soakGrowthInput(
      'article',
      'domNodes',
      ARTICLE_SOAK_DOM_GROWTH_EPSILON,
      declaredFirstMinute,
    ),
  },
  {
    key: 'requestCount',
    label: 'Requests per interaction run (5 interaction scenarios)',
    pillar: 'memory',
    unit: 'count',
    beta: 0,
    extract: resourceInput('requestCount'),
  },
]

export const PILLAR_LABELS: Record<SqrlPillarKey, string> = {
  inp: 'INP',
  responsiveness: 'Responsiveness',
  load: 'Load',
  cpu: 'CPU & rendering',
  memory: 'Memory & weight',
  reliability: 'Reliability',
}

export const PILLAR_ORDER: SqrlPillarKey[] = [
  'inp',
  'responsiveness',
  'load',
  'cpu',
  'memory',
  'reliability',
]

/** Host-adjusted value: geometric mean over parts of value × (reference / calibration)^beta, plus each part's epsilon. */
export function hostAdjustedValue(parts: SqrlPart[] | null, beta: number): number | null {
  if (parts === null) return null
  const logs = parts.map((part) => {
    const adjustment =
      part.calibrationMs && beta ? (REFERENCE_CALIBRATION_MS / part.calibrationMs) ** beta : 1
    return Math.log(part.value * adjustment + part.epsilon)
  })
  return Math.exp(logs.reduce((total, value) => total + value, 0) / logs.length)
}

/** Metric labels the run query asks for, so the projection stays small. */
export const SQRL_METRIC_LABELS = [
  'INP',
  ...new Set(KEYSTROKE_FIELDS.map(([, label]) => label)),
  'boot-cold · time to editable',
  'open-doc-warm · time to editable',
  'boot-cold · tool visible',
  'boot-cold · login clickable',
  'boot-cold · FCP',
  'boot-cold · LCP',
  'boot-cold · main-thread blocking',
  'boot-cold · CLS',
  'boot-cold · boot JS',
  'cpu after ready',
  'react commits after ready',
  'CSS bytes',
]
