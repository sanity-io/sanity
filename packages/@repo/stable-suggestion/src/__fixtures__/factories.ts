import {
  type Candidate,
  type Evaluation,
  type Evidence,
  type History,
  type Recommendation,
} from '../types'

export const AS_OF = '2026-11-17T18:10:00Z'
export const RUN_URL = 'https://github.com/example-org/example-repo/actions/runs/123'

export function makeCandidate(version: string, overrides: Partial<Candidate> = {}): Candidate {
  return {
    version,
    publishedAt: '2026-11-01T10:00:00Z',
    ageDays: 14.1,
    eligible: true,
    eligibleFrom: '2026-11-08T10:00:00Z',
    hard: [],
    soft: [],
    adoptionShare: 0.085,
    sqrl: {
      version,
      score: 114.4,
      scoreCommit: 1,
      formulaVersion: 1,
      regressedInputs: [],
      reliabilityEvents: 0,
      createdAt: '2026-11-02T10:00:00Z',
    },
    sqrlBaseline: 109,
    openIssueNumbers: [],
    ...overrides,
  }
}

export function makeEvaluation(overrides: Partial<Evaluation> = {}): Evaluation {
  const candidates = [
    makeCandidate('6.23.0', {ageDays: 7.1, adoptionShare: 0.156, openIssueNumbers: [101, 102]}),
    makeCandidate('6.22.0', {openIssueNumbers: [101]}),
    makeCandidate('6.21.0', {ageDays: 19.4}),
    makeCandidate('6.24.0', {
      eligible: false,
      ageDays: 0.2,
      eligibleFrom: '2026-11-24T17:42:00Z',
      hard: [{code: 'too-new', detail: 'published less than 7 days ago'}],
    }),
  ]
  return {
    asOf: AS_OF,
    mode: 'live',
    currentStable: '6.15.0',
    currentStableSince: '2026-09-29T09:00:00Z',
    latest: '6.24.0',
    candidates,
    eligible: ['6.23.0', '6.22.0', '6.21.0'],
    shortlist: ['6.23.0', '6.22.0', '6.21.0'],
    stableAtRisk: [],
    ...overrides,
  }
}

export function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    schemaVersion: 1,
    mode: 'live',
    asOf: AS_OF,
    currentStable: '6.15.0',
    currentStableSince: '2026-09-29T09:00:00Z',
    latest: '6.24.0',
    deprecationKnown: true,
    published: [],
    versions: [],
    packageSet: {names: ['sanity'], source: 'repo'},
    regressions: {status: 'ok', data: {confirmed: [], investigations: []}},
    sqrl: {status: 'ok', data: []},
    issues: {
      status: 'ok',
      data: [
        {
          number: 101,
          title: 'Example issue title',
          url: 'https://github.com/example-org/example-repo/issues/101',
          createdAt: '2026-11-10T10:00:00Z',
          closedAt: null,
          labels: [],
          versionsMentioned: ['6.23.0'],
        },
      ],
    },
    downloads: {status: 'ok', data: {'6.23.0': 156}},
    releaseBench: {status: 'ok', data: []},
    latestMoves: {status: 'ok', data: []},
    stableByPackage: {status: 'not-applicable'},
    ...overrides,
  }
}

export function makeRecommendation(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    schemaVersion: 1,
    evaluation: makeEvaluation(),
    decision: 'promote',
    shortlist: [
      {slot: 1, version: '6.23.0', reason: 'Newest eligible version.'},
      {slot: 2, version: '6.22.0', reason: 'One more week of soak.'},
      {slot: 3, version: '6.21.0', reason: 'Fallback if the open reports are regressions.'},
    ],
    source: 'model',
    fallbackReason: null,
    model: 'test-model',
    headline: 'Promote 6.23.0',
    rationale: 'No confirmed regressions in the eligible range.',
    concerns: [{version: '6.23.0', note: 'Two open bug reports mention it.'}],
    confidence: 'medium',
    ...overrides,
  }
}

export function makeHistory(overrides: Partial<History> = {}): History {
  return {
    fetchedAt: AS_OF,
    sanityVersions: [],
    packageVersions: {},
    repoPackageNames: ['sanity'],
    liveDistTags: {latest: '6.24.0', stable: '6.15.0'},
    liveDownloads: {status: 'ok', data: {}},
    stablePromotions: {status: 'ok', data: []},
    latestMoves: {status: 'ok', data: []},
    stableByPackage: {status: 'ok', data: {}},
    regressions: {status: 'ok', data: {confirmed: [], investigations: []}},
    sqrl: {status: 'ok', data: []},
    releaseBench: {status: 'ok', data: []},
    issues: {status: 'ok', data: []},
    ...overrides,
  }
}
