import {type DebugSource, mulberry32} from './debugData'
import {
  DAY_MS,
  type SqrlInput,
  type SqrlLatest,
  type SqrlPillar,
  type SqrlSeriesDocument,
  type SqrlTrend,
} from './sqrl'

export type SqrlDebugVariant = 'climb' | 'dip' | 'regressed' | 'empty'

export interface SqrlDebugData {
  series: SqrlSeriesDocument[]
  latest: SqrlLatest | null
}

const COMMIT_DAYS = 120
const ROLLING_WINDOW = 7
const SEEDS: Record<SqrlDebugVariant, number> = {dip: 7, climb: 11, regressed: 23, empty: 0}

export function sqrlVariantForSource(source: DebugSource): SqrlDebugVariant {
  switch (source) {
    case 'sqrl-climb':
      return 'climb'
    case 'sqrl-regressed':
      return 'regressed'
    case 'empty':
    case 'sqrl-empty':
      return 'empty'
    default:
      return 'dip'
  }
}

function trendFor(variant: SqrlDebugVariant, dayFromEnd: number): number {
  const day = COMMIT_DAYS - dayFromEnd
  const climb = 100 + day * 0.1
  switch (variant) {
    case 'dip': {
      const dipDepth = day >= 55 && day < 80 ? Math.sin(((day - 55) / 25) * Math.PI) * 9 : 0
      return climb - dipDepth
    }
    case 'regressed':
      return climb - (dayFromEnd <= 10 ? (10 - dayFromEnd) * 0.7 : 0)
    default:
      return climb
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function fakeSha(random: () => number): string {
  return Array.from({length: 40}, () => '0123456789abcdef'[Math.floor(random() * 16)]).join('')
}

const PILLAR_DEFINITIONS: {key: string; label: string; weight: number; offset: number}[] = [
  {key: 'inp', label: 'INP', weight: 0.35, offset: 2},
  {key: 'responsiveness', label: 'Responsiveness', weight: 0.13, offset: 6},
  {key: 'load', label: 'Load', weight: 0.13, offset: -3},
  {key: 'cpu', label: 'CPU & rendering', weight: 0.13, offset: 4},
  {key: 'memory', label: 'Memory & weight', weight: 0.13, offset: -1},
  {key: 'reliability', label: 'Reliability', weight: 0.13, offset: 8},
]

const INPUT_DEFINITIONS: {
  key: string
  label: string
  pillar: string
  unit: SqrlInput['unit']
  reference: number
}[] = [
  {key: 'inp-article', label: 'INP · article', pillar: 'inp', unit: 'ms', reference: 210},
  {
    key: 'inp-single-string',
    label: 'INP · single string',
    pillar: 'inp',
    unit: 'ms',
    reference: 140,
  },
  {
    key: 'keystroke-median',
    label: 'Keystroke latency · median',
    pillar: 'responsiveness',
    unit: 'ms',
    reference: 38,
  },
  {
    key: 'keystroke-p75',
    label: 'Keystroke latency · p75',
    pillar: 'responsiveness',
    unit: 'ms',
    reference: 52,
  },
  {
    key: 'time-to-editable',
    label: 'Time to editable',
    pillar: 'load',
    unit: 'ms',
    reference: 4200,
  },
  {key: 'lcp', label: 'LCP', pillar: 'load', unit: 'ms', reference: 1800},
  {
    key: 'main-thread-blocking',
    label: 'Main-thread blocking',
    pillar: 'cpu',
    unit: 'ms',
    reference: 620,
  },
  {key: 'react-commits', label: 'React commits', pillar: 'cpu', unit: 'count', reference: 70},
  {
    key: 'initial-js',
    label: 'Initial JS',
    pillar: 'memory',
    unit: 'bytes',
    reference: 1_420_000,
  },
  {
    key: 'soak-heap-growth',
    label: 'Soak heap growth',
    pillar: 'memory',
    unit: 'perMinute',
    reference: 0.4,
  },
  {
    key: 'request-count',
    label: 'Interaction requests',
    pillar: 'memory',
    unit: 'count',
    reference: 230,
  },
  {
    key: 'deprecated-releases',
    label: 'Deprecated releases',
    pillar: 'reliability',
    unit: 'events',
    reference: 2,
  },
]

const REGRESSED_INPUT_KEYS = new Set(['inp-article', 'main-thread-blocking', 'soak-heap-growth'])
const IMPROVED_INPUT_KEYS = new Set(['keystroke-median', 'lcp'])

function trendOf(flags: {regressed: boolean; improved: boolean}): SqrlTrend {
  if (flags.regressed) return 'regression'
  return flags.improved ? 'improvement' : 'neutral'
}

function buildInputs(variant: SqrlDebugVariant, score: number): SqrlInput[] {
  const totalPoints = score - 100
  const share = totalPoints / INPUT_DEFINITIONS.length
  return INPUT_DEFINITIONS.map((definition, index): SqrlInput => {
    const regressed = variant === 'regressed' && REGRESSED_INPUT_KEYS.has(definition.key)
    const improved = IMPROVED_INPUT_KEYS.has(definition.key)
    const trend = trendOf({regressed, improved})
    const contributionPoints = regressed
      ? -(1.2 + index * 0.35)
      : share + (improved ? 1.1 : (index % 3) * 0.2)
    const ratio = Math.exp(contributionPoints / 40)
    return {
      key: definition.key,
      label: definition.label,
      pillar: definition.pillar,
      weight: 1 / INPUT_DEFINITIONS.length,
      unit: definition.unit,
      value: definition.reference / ratio,
      referenceValue: definition.reference,
      ratio,
      contributionPoints,
      trend,
    }
  })
}

function buildLatest(
  variant: SqrlDebugVariant,
  series: SqrlSeriesDocument[],
  nowMs: number,
): SqrlLatest {
  const latestDocument = series[series.length - 1]
  const pillars = PILLAR_DEFINITIONS.map((definition): SqrlPillar => ({
    key: definition.key,
    label: definition.label,
    weight: definition.weight,
    score: latestDocument.score + definition.offset * (variant === 'regressed' ? 0.5 : 1),
  }))
  return {
    _id: `sqrl-score-${latestDocument.git.sha}`,
    formulaVersion: 1,
    computedAt: new Date(nowMs).toISOString(),
    git: {...latestDocument.git, branch: 'main'},
    score: latestDocument.score,
    scoreCommit: latestDocument.scoreCommit,
    scoreRaw: latestDocument.score + 1.4,
    host: {calibrationMs: 7.4, cpuModel: 'AMD EPYC 7763 64-Core Processor'},
    pillars,
    inputs: buildInputs(variant, latestDocument.score),
    reliability: {
      windowWeeks: 13,
      count: 1,
      referenceCount: 2,
      events: [{kind: 'deprecation', tag: 'v6.8.1', day: '2026-08-11'}],
    },
  }
}

export function generateSqrlDebug(
  variant: SqrlDebugVariant,
  nowMs: number = Date.now(),
): SqrlDebugData {
  if (variant === 'empty') return {series: [], latest: null}
  const random = mulberry32(SEEDS[variant])
  const commits = Array.from({length: COMMIT_DAYS}, (_, index) => {
    const dayFromEnd = COMMIT_DAYS - 1 - index
    return {
      sha: fakeSha(random),
      committedAt: new Date(nowMs - dayFromEnd * DAY_MS).toISOString(),
      scoreCommit: trendFor(variant, dayFromEnd) + (random() - 0.5) * 3,
    }
  })
  const series = commits.map((commit, index): SqrlSeriesDocument => ({
    score: median(
      commits
        .slice(Math.max(0, index - ROLLING_WINDOW + 1), index + 1)
        .map((entry) => entry.scoreCommit),
    ),
    scoreCommit: commit.scoreCommit,
    git: {sha: commit.sha, committedAt: commit.committedAt},
  }))
  return {series, latest: buildLatest(variant, series, nowMs)}
}
