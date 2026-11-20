import semver from 'semver'
import {describe, expect, test} from 'vitest'

import {NEW_MAJOR_SOAK_DAYS, SHORTLIST_SIZE, SOAK_DAYS, URGENT_SOAK_DAYS} from './config'
import {evaluate} from './rules'
import {
  type Candidate,
  type Evidence,
  type HardReasonCode,
  type Investigation,
  type IssueReport,
  type LatestMove,
  type RegressionRecord,
  type SoftFlagCode,
  type SqrlFacts,
} from './types'

const AS_OF = '2026-11-17T18:00:00.000Z'
const AS_OF_TIME = Date.parse(AS_OF)
const DAY_MS = 24 * 60 * 60 * 1000
const PACKAGE_NAMES = ['sanity', '@sanity/types']

function daysBefore(days: number, from: number = AS_OF_TIME): string {
  return new Date(from - days * DAY_MS).toISOString()
}

interface ReleaseInput {
  version: string
  ageDays: number
  deprecated?: string | null
  packages?: string[]
}

function makeEvidence(releases: ReleaseInput[], overrides: Partial<Evidence> = {}): Evidence {
  return {
    schemaVersion: 1,
    mode: 'live',
    asOf: AS_OF,
    currentStable: '6.15.0',
    currentStableSince: daysBefore(40),
    latest: releases.map((release) => release.version).sort(semver.rcompare)[0] ?? '6.15.0',
    deprecationKnown: true,
    published: releases.map((release) => ({
      version: release.version,
      publishedAt: daysBefore(release.ageDays),
    })),
    versions: releases.map((release) => ({
      version: release.version,
      publishedAt: daysBefore(release.ageDays),
      deprecated: release.deprecated ?? null,
      packagesWithVersion: release.packages ?? PACKAGE_NAMES,
    })),
    packageSet: {names: PACKAGE_NAMES, source: 'repo'},
    regressions: {status: 'ok', data: {confirmed: [], investigations: []}},
    sqrl: {status: 'ok', data: []},
    issues: {status: 'ok', data: []},
    downloads: {status: 'ok', data: {}},
    releaseBench: {status: 'ok', data: []},
    latestMoves: {status: 'ok', data: []},
    ...overrides,
  }
}

function regression(overrides: Partial<RegressionRecord> = {}): RegressionRecord {
  return {
    id: 'regression-1',
    introducedIn: '6.16.0',
    fixedIn: null,
    severity: 'major',
    knownAt: daysBefore(30),
    label: 'v6.15.0 to v6.16.0',
    ...overrides,
  }
}

function withRegressions(
  confirmed: RegressionRecord[],
  investigations: Investigation[] = [],
): Pick<Evidence, 'regressions'> {
  return {regressions: {status: 'ok', data: {confirmed, investigations}}}
}

function sqrlFacts(version: string, score: number, overrides: Partial<SqrlFacts> = {}): SqrlFacts {
  return {
    version,
    score,
    scoreCommit: score,
    formulaVersion: 3,
    regressedInputs: [],
    reliabilityEvents: 0,
    createdAt: daysBefore(60),
    ...overrides,
  }
}

function issue(overrides: Partial<IssueReport> = {}): IssueReport {
  return {
    number: 101,
    title: 'a report',
    url: 'https://example.test/issues/101',
    createdAt: daysBefore(2),
    closedAt: null,
    labels: ['bug'],
    versionsMentioned: ['6.17.0'],
    ...overrides,
  }
}

function candidateOf(evidence: Evidence, version: string): Candidate {
  const found = evaluate(evidence).candidates.find((candidate) => candidate.version === version)
  if (found === undefined) throw new Error(`no candidate ${version}`)
  return found
}

function hardCodes(candidate: Candidate): HardReasonCode[] {
  return candidate.hard.map((verdict) => verdict.code)
}

function softCodes(candidate: Candidate): SoftFlagCode[] {
  return candidate.soft.map((verdict) => verdict.code)
}

describe('universe', () => {
  test('excludes prereleases, the current stable and anything older', () => {
    const evidence = makeEvidence([
      {version: '6.14.0', ageDays: 90},
      {version: '6.15.0', ageDays: 60},
      {version: '6.16.0-next.1', ageDays: 20},
      {version: '6.16.0', ageDays: 20},
    ])
    expect(evaluate(evidence).candidates.map((candidate) => candidate.version)).toEqual(['6.16.0'])
  })

  test('excludes versions published after the as-of instant', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.17.0', ageDays: -1},
    ])
    expect(evaluate(evidence).candidates.map((candidate) => candidate.version)).toEqual(['6.16.0'])
  })

  test('is empty when nothing is newer than stable', () => {
    const evaluation = evaluate(makeEvidence([{version: '6.15.0', ageDays: 60}]))
    expect(evaluation.candidates).toEqual([])
    expect(evaluation.eligible).toEqual([])
    expect(evaluation.shortlist).toEqual([])
  })

  test('copies the context fields onto the evaluation', () => {
    const evaluation = evaluate(makeEvidence([{version: '6.16.0', ageDays: 20}]))
    expect(evaluation).toMatchObject({
      asOf: AS_OF,
      mode: 'live',
      currentStable: '6.15.0',
      latest: '6.16.0',
    })
  })
})

describe('too-new', () => {
  test('is eligible exactly at the soak boundary', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: SOAK_DAYS}])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })

  test('is held 1 ms before the boundary', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: SOAK_DAYS}])
    const publishedAt = new Date(AS_OF_TIME - SOAK_DAYS * DAY_MS + 1).toISOString()
    const nearlyOld: Evidence = {...evidence, published: [{version: '6.16.0', publishedAt}]}
    const candidate = candidateOf(nearlyOld, '6.16.0')
    expect(hardCodes(candidate)).toEqual(['too-new'])
    expect(candidate.eligible).toBe(false)
  })

  test('is eligible 1 ms after the boundary', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: SOAK_DAYS}])
    const publishedAt = new Date(AS_OF_TIME - SOAK_DAYS * DAY_MS - 1).toISOString()
    const older: Evidence = {...evidence, published: [{version: '6.16.0', publishedAt}]}
    expect(hardCodes(candidateOf(older, '6.16.0'))).toEqual([])
  })

  test('reports age, eligibleFrom and a readable detail', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 2}])
    const candidate = candidateOf(evidence, '6.16.0')
    expect(candidate.ageDays).toBeCloseTo(2, 5)
    expect(candidate.eligibleFrom).toBe(new Date(AS_OF_TIME + 5 * DAY_MS).toISOString())
    expect(candidate.hard[0]?.detail).toContain('2 days')
    expect(candidate.hard[0]?.detail).toContain(candidate.eligibleFrom)
  })
})

describe('superseded', () => {
  test('holds an older patch of a minor once a newer patch is published', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.16.1', ageDays: 10},
    ])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['superseded'])
    expect(hardCodes(candidateOf(evidence, '6.16.1'))).toEqual([])
    expect(evaluate(evidence).eligible).toEqual(['6.16.1'])
  })

  test('holds the older patch even while the newer patch is still soaking', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.16.1', ageDays: 2},
    ])
    const evaluation = evaluate(evidence)
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['superseded'])
    expect(hardCodes(candidateOf(evidence, '6.16.1'))).toEqual(['too-new'])
    expect(evaluation.eligible).toEqual([])
  })

  test('ignores patches published after the as-of instant and other minors', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.16.1', ageDays: -1},
      {version: '6.17.0', ageDays: 10},
    ])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })

  test('ignores a newer patch that is a prerelease', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.16.1-next.1', ageDays: 10},
    ])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })

  test('ignores a newer patch that is deprecated', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 20},
      {version: '6.16.1', ageDays: 10, deprecated: 'do not use'},
    ])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
    expect(hardCodes(candidateOf(evidence, '6.16.1'))).toEqual(['deprecated'])
  })

  test('ignores a newer patch above the live latest', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.16.1', ageDays: 10},
      ],
      {latest: '6.16.0'},
    )
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })

  test('ignores a newer patch that latest was rolled back past', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.16.1', ageDays: 10},
      ],
      {latestMoves: {status: 'ok', data: [{version: '6.16.0', at: daysBefore(5)}]}},
    )
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
    expect(hardCodes(candidateOf(evidence, '6.16.1'))).toEqual(['rolled-back'])
  })
})

describe('deprecated', () => {
  test('blocks a deprecated version when deprecation is known', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 20, deprecated: 'do not use'}])
    const candidate = candidateOf(evidence, '6.16.0')
    expect(hardCodes(candidate)).toEqual(['deprecated'])
    expect(candidate.hard[0]?.detail).toContain('do not use')
  })

  test('is ignored when deprecation is not known', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 20, deprecated: 'do not use'}], {
      deprecationKnown: false,
    })
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })

  test('an empty deprecation message does not block', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 20, deprecated: ''}])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
  })
})

describe('regression', () => {
  test('blocks every version at or after the introduced version when there is no fix', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 30},
        {version: '6.17.0', ageDays: 20},
      ],
      withRegressions([regression({introducedIn: '6.17.0'})]),
    )
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual(['regression'])
    expect(candidateOf(evidence, '6.17.0').hard[0]?.detail).toContain('no fix published')
  })

  test('a version at or after a published fix is eligible', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 40},
        {version: '6.17.0', ageDays: 30},
        {version: '6.18.0', ageDays: 20},
      ],
      withRegressions([regression({introducedIn: '6.16.0', fixedIn: '6.18.0'})]),
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual(['regression'])
    expect(hardCodes(candidateOf(evidence, '6.18.0'))).toEqual([])
  })

  test('a fix that is not yet published at the as-of instant does not clear anything', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 40},
        {version: '6.18.0', ageDays: -1},
      ],
      withRegressions([regression({introducedIn: '6.16.0', fixedIn: '6.18.0'})]),
    )
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['regression'])
  })

  test('a fix that is not in the published list does not clear anything', () => {
    const evidence = makeEvidence(
      [{version: '6.16.0', ageDays: 40}],
      withRegressions([regression({introducedIn: '6.16.0', fixedIn: '6.99.0'})]),
    )
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['regression'])
  })

  test('in as-of mode a regression is ignored before it was known', () => {
    const releases = [{version: '6.16.0', ageDays: 20}]
    const regressions = withRegressions([regression({knownAt: daysBefore(-1)})])
    expect(
      hardCodes(candidateOf(makeEvidence(releases, {...regressions, mode: 'as-of'}), '6.16.0')),
    ).toEqual([])
    expect(
      hardCodes(candidateOf(makeEvidence(releases, {...regressions, mode: 'live'}), '6.16.0')),
    ).toEqual(['regression'])
  })

  test('in as-of mode a regression is applied once known', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 20}], {
      ...withRegressions([regression({knownAt: daysBefore(1)})]),
      mode: 'as-of',
    })
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['regression'])
  })

  test('one verdict per blocking regression', () => {
    const evidence = makeEvidence(
      [{version: '6.17.0', ageDays: 20}],
      withRegressions([regression({id: 'a'}), regression({id: 'b', introducedIn: '6.17.0'})]),
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual(['regression', 'regression'])
  })
})

describe('missing-packages', () => {
  test('holds a version some package never published', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 30, packages: ['sanity']},
      {version: '6.17.0', ageDays: 30},
    ])
    const candidate = candidateOf(evidence, '6.16.0')
    expect(hardCodes(candidate)).toEqual(['missing-packages'])
    expect(candidate.hard[0]?.detail).toContain('@sanity/types')
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })

  test('holds 6.11.0 at 2026-09-01 when the validation package had no 6.x before 6.12.0', () => {
    const septemberFirst = Date.parse('2026-09-01T00:00:00.000Z')
    const evidence = makeEvidence(
      [{version: '6.11.0', ageDays: 20, packages: ['sanity', '@sanity/types']}],
      {
        asOf: new Date(septemberFirst).toISOString(),
        currentStable: '6.10.0',
        published: [{version: '6.11.0', publishedAt: daysBefore(20, septemberFirst)}],
        packageSet: {
          names: ['sanity', '@sanity/types', '@sanity/validation'],
          source: 'as-of-inferred',
        },
      },
    )
    const candidate = candidateOf(evidence, '6.11.0')
    expect(hardCodes(candidate)).toEqual(['missing-packages'])
    expect(candidate.hard[0]?.detail).toContain('@sanity/validation')
  })

  test('holds a version with no version facts at all', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 30}], {versions: []})
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['missing-packages'])
  })
})

describe('regression-data-unavailable', () => {
  test('makes every version ineligible', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 30},
        {version: '6.17.0', ageDays: 20},
      ],
      {regressions: {status: 'unavailable', error: 'no token'}},
    )
    const evaluation = evaluate(evidence)
    expect(evaluation.eligible).toEqual([])
    expect(evaluation.shortlist).toEqual([])
    evaluation.candidates.forEach((candidate) => {
      expect(hardCodes(candidate)).toEqual(['regression-data-unavailable'])
    })
    expect(evaluation.stableAtRisk).toEqual([])
  })

  test('names the reason the regression data is unavailable', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: 30}], {
      regressions: {
        status: 'unavailable',
        error: 'confirmed regression session-commit cannot be placed',
      },
    })
    expect(candidateOf(evidence, '6.16.0').hard[0]?.detail).toContain('session-commit')
  })
})

describe('ranking and shortlist', () => {
  const releases: ReleaseInput[] = [
    {version: '6.16.0', ageDays: 50},
    {version: '6.17.0', ageDays: 40},
    {version: '6.18.0', ageDays: 30},
    {version: '6.19.0', ageDays: 20},
    {version: '6.20.0', ageDays: 2},
  ]

  test('lists eligible versions newest first by semver, not by string', () => {
    const evidence = makeEvidence(
      [
        {version: '6.9.0', ageDays: 50},
        {version: '6.10.0', ageDays: 40},
      ],
      {currentStable: '6.8.0'},
    )
    expect(evaluate(evidence).eligible).toEqual(['6.10.0', '6.9.0'])
  })

  test(`caps the shortlist at ${SHORTLIST_SIZE} and skips ineligible versions`, () => {
    const evaluation = evaluate(makeEvidence(releases))
    expect(evaluation.eligible).toEqual(['6.19.0', '6.18.0', '6.17.0', '6.16.0'])
    expect(evaluation.shortlist).toEqual(['6.19.0', '6.18.0', '6.17.0'])
    expect(evaluation.candidates.map((candidate) => candidate.version)).toEqual([
      '6.20.0',
      '6.19.0',
      '6.18.0',
      '6.17.0',
      '6.16.0',
    ])
  })
})

describe('stableAtRisk', () => {
  test('reports a confirmed regression that hits the current stable', () => {
    const evidence = makeEvidence(
      [{version: '6.16.0', ageDays: 30}],
      withRegressions([regression({introducedIn: '6.14.0'})]),
    )
    const evaluation = evaluate(evidence)
    expect(evaluation.stableAtRisk).toHaveLength(1)
    expect(evaluation.stableAtRisk[0]?.code).toBe('regression')
  })

  test('is empty when the regression was introduced after stable', () => {
    const evidence = makeEvidence(
      [{version: '6.16.0', ageDays: 30}],
      withRegressions([regression({introducedIn: '6.16.0'})]),
    )
    expect(evaluate(evidence).stableAtRisk).toEqual([])
  })

  test('is empty when the fix shipped at or before stable', () => {
    const evidence = makeEvidence(
      [
        {version: '6.14.0', ageDays: 90},
        {version: '6.16.0', ageDays: 30},
      ],
      {
        ...withRegressions([regression({introducedIn: '6.9.2', fixedIn: '6.14.0'})]),
        currentStable: '6.15.0',
      },
    )
    expect(evaluate(evidence).stableAtRisk).toEqual([])
  })
})

describe('too-new for a new major', () => {
  function newMajorEvidence(offsetMs: number, version = '7.0.0'): Evidence {
    const evidence = makeEvidence([{version, ageDays: NEW_MAJOR_SOAK_DAYS}])
    const publishedAt = new Date(AS_OF_TIME - NEW_MAJOR_SOAK_DAYS * DAY_MS + offsetMs).toISOString()
    return {...evidence, published: [{version, publishedAt}]}
  }

  test('is eligible exactly at 3 days', () => {
    expect(hardCodes(candidateOf(newMajorEvidence(0), '7.0.0'))).toEqual([])
  })

  test('is held 1 ms before 3 days', () => {
    expect(hardCodes(candidateOf(newMajorEvidence(1), '7.0.0'))).toEqual(['too-new'])
  })

  test('is eligible 1 ms after 3 days', () => {
    expect(hardCodes(candidateOf(newMajorEvidence(-1), '7.0.0'))).toEqual([])
  })

  test('eligibleFrom uses 3 days for a new major and 7 days for the same major', () => {
    const evidence = makeEvidence([
      {version: '7.0.0', ageDays: 1},
      {version: '6.16.0', ageDays: 1},
    ])
    expect(candidateOf(evidence, '7.0.0').eligibleFrom).toBe(
      new Date(AS_OF_TIME + 2 * DAY_MS).toISOString(),
    )
    expect(candidateOf(evidence, '6.16.0').eligibleFrom).toBe(
      new Date(AS_OF_TIME + 6 * DAY_MS).toISOString(),
    )
  })

  test('a same-major version still needs 7 days', () => {
    const evidence = makeEvidence([{version: '6.16.0', ageDays: NEW_MAJOR_SOAK_DAYS + 1}])
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual(['too-new'])
  })

  test('other hard rules still apply to a new major', () => {
    const evidence = makeEvidence([{version: '7.0.0', ageDays: 5, packages: ['sanity']}])
    expect(hardCodes(candidateOf(evidence, '7.0.0'))).toEqual(['missing-packages'])
  })
})

describe('is-patch and major-upgrade', () => {
  test('flags patches and major upgrades', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 30},
      {version: '6.17.1', ageDays: 30},
      {version: '7.0.0', ageDays: 30},
    ])
    expect(softCodes(candidateOf(evidence, '6.16.0'))).not.toContain('is-patch')
    expect(softCodes(candidateOf(evidence, '6.17.1'))).toContain('is-patch')
    expect(softCodes(candidateOf(evidence, '6.17.1'))).not.toContain('major-upgrade')
    expect(softCodes(candidateOf(evidence, '7.0.0'))).toContain('major-upgrade')
    const detail = candidateOf(evidence, '7.0.0').soft.find(
      (verdict) => verdict.code === 'major-upgrade',
    )?.detail
    expect(detail).toBe("new major: 7.x supersedes stable's 6.x line")
  })
})

describe('sqrl flags', () => {
  const releases: ReleaseInput[] = [{version: '6.20.0', ageDays: 20}]
  const baselineScores = [
    sqrlFacts('6.16.0', 100),
    sqrlFacts('6.17.0', 100),
    sqrlFacts('6.18.0', 100),
    sqrlFacts('6.19.0', 100),
  ]

  function withSqrl(data: SqrlFacts[]): Evidence {
    return makeEvidence(releases, {sqrl: {status: 'ok', data}})
  }

  test('flags a drop below the ratio of the prior median', () => {
    const candidate = candidateOf(withSqrl([...baselineScores, sqrlFacts('6.20.0', 89)]), '6.20.0')
    expect(softCodes(candidate)).toContain('sqrl-drop')
    expect(candidate.sqrlBaseline).toBe(100)
    expect(candidate.sqrl?.score).toBe(89)
  })

  test('does not flag a score at the ratio', () => {
    const candidate = candidateOf(withSqrl([...baselineScores, sqrlFacts('6.20.0', 90)]), '6.20.0')
    expect(softCodes(candidate)).not.toContain('sqrl-drop')
  })

  test('uses only the four most recent previous releases', () => {
    const data = [
      sqrlFacts('6.10.0', 10),
      sqrlFacts('6.11.0', 10),
      ...baselineScores,
      sqrlFacts('6.20.0', 95),
    ]
    expect(candidateOf(withSqrl(data), '6.20.0').sqrlBaseline).toBe(100)
  })

  test('takes the median of an even baseline', () => {
    const data = [sqrlFacts('6.18.0', 100), sqrlFacts('6.19.0', 120), sqrlFacts('6.20.0', 120)]
    expect(candidateOf(withSqrl(data), '6.20.0').sqrlBaseline).toBe(110)
  })

  test('needs at least two baseline points', () => {
    const data = [sqrlFacts('6.19.0', 100), sqrlFacts('6.20.0', 1)]
    const candidate = candidateOf(withSqrl(data), '6.20.0')
    expect(candidate.sqrlBaseline).toBeNull()
    expect(softCodes(candidate)).not.toContain('sqrl-drop')
  })

  test('excludes baseline points with a different formula version', () => {
    const data = [
      sqrlFacts('6.18.0', 100, {formulaVersion: 2}),
      sqrlFacts('6.19.0', 100, {formulaVersion: 2}),
      sqrlFacts('6.20.0', 1),
    ]
    const candidate = candidateOf(withSqrl(data), '6.20.0')
    expect(candidate.sqrlBaseline).toBeNull()
    expect(softCodes(candidate)).not.toContain('sqrl-drop')
  })

  test('ignores scores created after the as-of instant', () => {
    const data = [
      sqrlFacts('6.18.0', 100),
      sqrlFacts('6.19.0', 100, {createdAt: daysBefore(-1)}),
      sqrlFacts('6.20.0', 1),
    ]
    expect(candidateOf(withSqrl(data), '6.20.0').sqrlBaseline).toBeNull()
  })

  test('flags regressed inputs and reliability events', () => {
    const candidate = candidateOf(
      withSqrl([
        sqrlFacts('6.20.0', 100, {regressedInputs: ['listeners', 'forms'], reliabilityEvents: 2}),
      ]),
      '6.20.0',
    )
    expect(softCodes(candidate)).toEqual(
      expect.arrayContaining(['sqrl-regressed-inputs', 'sqrl-reliability']),
    )
    expect(
      candidate.soft.find((verdict) => verdict.code === 'sqrl-regressed-inputs')?.detail,
    ).toContain('listeners, forms')
  })

  test('a single reliability event reads in the singular', () => {
    const candidate = candidateOf(
      withSqrl([sqrlFacts('6.20.0', 100, {reliabilityEvents: 1})]),
      '6.20.0',
    )
    expect(candidate.soft.find((verdict) => verdict.code === 'sqrl-reliability')?.detail).toContain(
      '1 SQRL reliability event',
    )
  })

  test('flags a missing score only when SQRL data is available', () => {
    expect(softCodes(candidateOf(withSqrl([]), '6.20.0'))).toContain('sqrl-missing')
    const unavailable = makeEvidence(releases, {sqrl: {status: 'unavailable', error: 'down'}})
    expect(softCodes(candidateOf(unavailable, '6.20.0'))).not.toContain('sqrl-missing')
  })
})

describe('open-issue-reports', () => {
  const releases: ReleaseInput[] = [{version: '6.17.0', ageDays: 20}]

  function withIssues(data: IssueReport[]): Candidate {
    return candidateOf(makeEvidence(releases, {issues: {status: 'ok', data}}), '6.17.0')
  }

  test('flags open issues that mention the version and lists their numbers', () => {
    const candidate = withIssues([issue({number: 5}), issue({number: 9})])
    expect(softCodes(candidate)).toContain('open-issue-reports')
    expect(candidate.openIssueNumbers).toEqual([5, 9])
  })

  test('ignores feature requests, other versions and issues created after the as-of instant', () => {
    const candidate = withIssues([
      issue({labels: ['Feature']}),
      issue({versionsMentioned: ['6.16.0']}),
      issue({createdAt: daysBefore(-1)}),
    ])
    expect(candidate.openIssueNumbers).toEqual([])
    expect(softCodes(candidate)).not.toContain('open-issue-reports')
  })

  test('ignores issues closed at or before the as-of instant, keeps those closed later', () => {
    expect(withIssues([issue({closedAt: daysBefore(1)})]).openIssueNumbers).toEqual([])
    expect(withIssues([issue({closedAt: AS_OF})]).openIssueNumbers).toEqual([])
    expect(withIssues([issue({closedAt: daysBefore(-1)})]).openIssueNumbers).toEqual([101])
  })

  test('says nothing when issue data is unavailable', () => {
    const evidence = makeEvidence(releases, {issues: {status: 'unavailable', error: 'down'}})
    expect(softCodes(candidateOf(evidence, '6.17.0'))).not.toContain('open-issue-reports')
  })
})

describe('open-investigation', () => {
  const releases: ReleaseInput[] = [
    {version: '6.16.0', ageDays: 40},
    {version: '6.17.0', ageDays: 30},
    {version: '6.18.0', ageDays: 20},
  ]

  function investigation(overrides: Partial<Investigation> = {}): Investigation {
    return {
      id: 'investigation-1',
      goodVersion: '6.16.0',
      badVersion: '6.17.0',
      knownAt: daysBefore(5),
      ...overrides,
    }
  }

  test('flags versions after good up to and including bad', () => {
    const evidence = makeEvidence(releases, withRegressions([], [investigation()]))
    expect(softCodes(candidateOf(evidence, '6.16.0'))).not.toContain('open-investigation')
    expect(softCodes(candidateOf(evidence, '6.17.0'))).toContain('open-investigation')
    expect(softCodes(candidateOf(evidence, '6.18.0'))).not.toContain('open-investigation')
  })

  test('in as-of mode ignores investigations created later', () => {
    const evidence = makeEvidence(releases, {
      ...withRegressions([], [investigation({knownAt: daysBefore(-1)})]),
      mode: 'as-of',
    })
    expect(softCodes(candidateOf(evidence, '6.17.0'))).not.toContain('open-investigation')
  })

  test('is not a hard reason', () => {
    const evidence = makeEvidence(releases, withRegressions([], [investigation()]))
    expect(candidateOf(evidence, '6.17.0').eligible).toBe(true)
  })

  test('says nothing when Radar is unavailable', () => {
    const evidence = makeEvidence(releases, {regressions: {status: 'unavailable', error: 'down'}})
    expect(softCodes(candidateOf(evidence, '6.17.0'))).not.toContain('open-investigation')
  })
})

describe('adoption-below-stable', () => {
  const releases: ReleaseInput[] = [
    {version: '6.15.0', ageDays: 60},
    {version: '6.16.0', ageDays: 30},
    {version: '6.17.0', ageDays: 20},
  ]
  const downloads = {
    '6.15.0': 200,
    '6.16.0': 100,
    '6.17.0': 700,
    '7.0.0-next.1': 5000,
    '5.0.0': 5000,
  }

  test('flags a version with a lower download share than stable in live mode', () => {
    const evidence = makeEvidence(releases, {downloads: {status: 'ok', data: downloads}})
    const low = candidateOf(evidence, '6.16.0')
    expect(softCodes(low)).toContain('adoption-below-stable')
    expect(low.adoptionShare).toBeCloseTo(0.1, 5)
    const high = candidateOf(evidence, '6.17.0')
    expect(softCodes(high)).not.toContain('adoption-below-stable')
    expect(high.adoptionShare).toBeCloseTo(0.7, 5)
  })

  test('is not evaluated in as-of mode', () => {
    const evidence = makeEvidence(releases, {
      mode: 'as-of',
      downloads: {status: 'not-applicable'},
    })
    const candidate = candidateOf(evidence, '6.16.0')
    expect(softCodes(candidate)).not.toContain('adoption-below-stable')
    expect(candidate.adoptionShare).toBeNull()
  })

  test('is not evaluated in as-of mode even when downloads were supplied', () => {
    const evidence = makeEvidence(releases, {
      mode: 'as-of',
      downloads: {status: 'ok', data: downloads},
    })
    expect(candidateOf(evidence, '6.16.0').adoptionShare).toBeNull()
  })

  test('is not evaluated when downloads are unavailable', () => {
    const evidence = makeEvidence(releases, {downloads: {status: 'unavailable', error: 'down'}})
    expect(candidateOf(evidence, '6.16.0').adoptionShare).toBeNull()
  })

  test('is not evaluated when stable and latest are in different majors', () => {
    const evidence = makeEvidence([...releases, {version: '7.0.0', ageDays: 10}], {
      downloads: {status: 'ok', data: {...downloads, '7.0.0': 1}},
    })
    expect(softCodes(candidateOf(evidence, '6.16.0'))).not.toContain('adoption-below-stable')
  })

  test('has no share when the major has no downloads or the version is another major', () => {
    const empty = makeEvidence(releases, {downloads: {status: 'ok', data: {}}})
    expect(candidateOf(empty, '6.16.0').adoptionShare).toBeNull()
    const mixed = makeEvidence([...releases, {version: '5.20.0', ageDays: 10}], {
      currentStable: '5.0.0',
      downloads: {status: 'ok', data: downloads},
    })
    expect(candidateOf(mixed, '5.20.0').adoptionShare).toBeNull()
  })

  test('treats a version missing from the downloads as zero share', () => {
    const evidence = makeEvidence(releases, {downloads: {status: 'ok', data: {'6.15.0': 10}}})
    expect(candidateOf(evidence, '6.16.0').adoptionShare).toBe(0)
  })
})

describe('purity', () => {
  test('does not mutate its input and is deterministic', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 30},
      {version: '6.17.0', ageDays: 20},
    ])
    const snapshot = structuredClone(evidence)
    expect(evaluate(evidence)).toEqual(evaluate(evidence))
    expect(evidence).toEqual(snapshot)
  })
})

function withPublishedAt(evidence: Evidence, version: string, offsetMs: number): Evidence {
  const publishedAt = new Date(AS_OF_TIME - URGENT_SOAK_DAYS * DAY_MS + offsetMs).toISOString()
  return {
    ...evidence,
    published: evidence.published.map((entry) =>
      entry.version === version ? {...entry, publishedAt} : entry,
    ),
  }
}

describe('urgent soak for a patch of stable', () => {
  const evidence = makeEvidence([{version: '6.15.1', ageDays: URGENT_SOAK_DAYS}])

  test('is eligible exactly at 1 day', () => {
    expect(hardCodes(candidateOf(withPublishedAt(evidence, '6.15.1', 0), '6.15.1'))).toEqual([])
  })

  test('is held 1 ms before 1 day', () => {
    expect(hardCodes(candidateOf(withPublishedAt(evidence, '6.15.1', 1), '6.15.1'))).toEqual([
      'too-new',
    ])
  })

  test('is eligible 1 ms after 1 day', () => {
    expect(hardCodes(candidateOf(withPublishedAt(evidence, '6.15.1', -1), '6.15.1'))).toEqual([])
  })

  test('reports the reason and an eligibleFrom one day after publishing', () => {
    const fresh = makeEvidence([{version: '6.15.1', ageDays: 0.5}])
    const candidate = candidateOf(fresh, '6.15.1')
    expect(candidate.urgentReason).toBe('stable-patch')
    expect(candidate.eligibleFrom).toBe(new Date(AS_OF_TIME + 0.5 * DAY_MS).toISOString())
  })

  test('a newer minor keeps the 7 day soak', () => {
    const other = makeEvidence([{version: '6.16.0', ageDays: 2}])
    expect(candidateOf(other, '6.16.0').urgentReason).toBeNull()
    expect(hardCodes(candidateOf(other, '6.16.0'))).toEqual(['too-new'])
  })

  test('other hard rules still apply', () => {
    const broken = makeEvidence([{version: '6.15.1', ageDays: 3, packages: ['sanity']}])
    expect(hardCodes(candidateOf(broken, '6.15.1'))).toEqual(['missing-packages'])
  })
})

describe('urgent soak for a fix of a broken stable', () => {
  const brokenStable = (fixedIn: string | null) =>
    makeEvidence(
      [
        {version: '6.16.0', ageDays: 0.5},
        {version: '6.17.0', ageDays: 0.5},
      ],
      withRegressions([regression({introducedIn: '6.14.0', fixedIn})]),
    )

  test('a version at or above the fix gets the 1 day soak', () => {
    const evidence = brokenStable('6.16.0')
    expect(candidateOf(evidence, '6.16.0').urgentReason).toBe('stable-at-risk-fix')
    expect(candidateOf(evidence, '6.17.0').urgentReason).toBe('stable-at-risk-fix')
    expect(evaluate(evidence).eligible).toEqual([])
    const aged = makeEvidence(
      [{version: '6.16.0', ageDays: URGENT_SOAK_DAYS}],
      withRegressions([regression({introducedIn: '6.14.0', fixedIn: '6.16.0'})]),
    )
    expect(evaluate(aged).eligible).toEqual(['6.16.0'])
  })

  test('without a published fix there is no urgent soak', () => {
    const aged = makeEvidence(
      [{version: '6.16.0', ageDays: URGENT_SOAK_DAYS}],
      withRegressions([regression({introducedIn: '6.14.0', fixedIn: null})]),
    )
    expect(candidateOf(aged, '6.16.0').urgentReason).toBeNull()
    expect(hardCodes(candidateOf(aged, '6.16.0'))).toContain('too-new')
  })

  test('every regression hitting stable needs a fix at or below the version', () => {
    const evidence = makeEvidence(
      [{version: '6.16.0', ageDays: 0.5}],
      withRegressions([
        regression({id: 'one', introducedIn: '6.14.0', fixedIn: '6.16.0'}),
        regression({id: 'two', introducedIn: '6.14.0', fixedIn: null}),
      ]),
    )
    expect(candidateOf(evidence, '6.16.0').urgentReason).toBeNull()
  })
})

describe('urgent ordering', () => {
  test('patches of stable come first, then the rest newest first', () => {
    const evidence = makeEvidence([
      {version: '6.15.1', ageDays: 3},
      {version: '6.16.0', ageDays: 30},
      {version: '6.17.0', ageDays: 30},
    ])
    const evaluation = evaluate(evidence)
    expect(evaluation.eligible).toEqual(['6.15.1', '6.17.0', '6.16.0'])
    expect(evaluation.shortlist).toEqual(['6.15.1', '6.17.0', '6.16.0'])
  })

  test('without a patch of stable the order is newest first', () => {
    const evidence = makeEvidence([
      {version: '6.16.0', ageDays: 30},
      {version: '6.17.0', ageDays: 30},
    ])
    expect(evaluate(evidence).eligible).toEqual(['6.17.0', '6.16.0'])
  })
})

describe('stableSplit', () => {
  const evidenceWith = (stableByPackage: Evidence['stableByPackage']) =>
    makeEvidence([{version: '6.16.0', ageDays: 30}], {stableByPackage})

  test('consistent tags produce no record', () => {
    const evaluation = evaluate(
      evidenceWith({status: 'ok', data: {'sanity': '6.15.0', '@sanity/types': '6.15.0'}}),
    )
    expect(evaluation.stableSplit).toBeNull()
  })

  test('disagreeing packages produce a record that carries every tag', () => {
    const data = {'sanity': '6.15.0', '@sanity/types': '6.14.1', '@sanity/util': null}
    const evaluation = evaluate(evidenceWith({status: 'ok', data}))
    expect(evaluation.stableSplit).toEqual({sanityStable: '6.15.0', byPackage: data})
  })

  test('a split does not block promotion', () => {
    const evaluation = evaluate(
      evidenceWith({status: 'ok', data: {'sanity': '6.15.0', '@sanity/types': '6.14.1'}}),
    )
    expect(evaluation.eligible).toEqual(['6.16.0'])
  })

  test('as-of mode and unavailable data produce no record', () => {
    expect(evaluate(evidenceWith({status: 'not-applicable'})).stableSplit).toBeNull()
    expect(evaluate(evidenceWith({status: 'unavailable', error: 'down'})).stableSplit).toBeNull()
  })
})

describe('rolled-back', () => {
  const moveAt = (version: string, daysAgo: number): LatestMove => ({
    version,
    at: daysBefore(daysAgo),
  })
  const withMoves = (moves: LatestMove[], releases: ReleaseInput[]) =>
    makeEvidence(releases, {latestMoves: {status: 'ok', data: moves}})

  test('excludes a same-major version above the target published before the move', () => {
    const evidence = withMoves(
      [moveAt('6.16.0', 5)],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual(['rolled-back'])
    expect(candidateOf(evidence, '6.17.0').hard[0]?.detail).toContain('6.16.0')
    expect(hardCodes(candidateOf(evidence, '6.16.0'))).toEqual([])
    expect(evaluate(evidence).eligible).toEqual(['6.16.0'])
  })

  test('a same-version re-point is harmless', () => {
    const evidence = withMoves(
      [moveAt('6.17.0', 5)],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })

  test('a version published after the move is not rolled back', () => {
    const evidence = withMoves(
      [moveAt('6.16.0', 15)],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })

  test('a different major is not rolled back', () => {
    const evidence = withMoves(
      [moveAt('6.16.0', 5)],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '7.0.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '7.0.0'))).toEqual([])
  })

  test('a later move back up to the version restores it', () => {
    const evidence = withMoves(
      [moveAt('6.16.0', 5), moveAt('6.17.0', 2)],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })

  test('a move after the as-of instant is ignored', () => {
    const evidence = withMoves(
      [{version: '6.16.0', at: new Date(AS_OF_TIME + DAY_MS).toISOString()}],
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
      ],
    )
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })

  test('unavailable move history does not exclude anything', () => {
    const evidence = makeEvidence([{version: '6.17.0', ageDays: 10}], {
      latestMoves: {status: 'unavailable', error: 'down'},
    })
    expect(hardCodes(candidateOf(evidence, '6.17.0'))).toEqual([])
  })
})

describe('urgent mode on a new major', () => {
  const brokenStable = (releases: ReleaseInput[]) =>
    makeEvidence(
      releases,
      withRegressions([regression({introducedIn: '6.14.0', fixedIn: '6.16.0'})]),
    )

  test('a 1.5 day old new major is too new and never leads when stable is broken', () => {
    const evidence = brokenStable([
      {version: '6.16.0', ageDays: 20},
      {version: '6.23.0', ageDays: 10},
      {version: '7.0.0', ageDays: 1.5},
    ])
    const evaluation = evaluate(evidence)
    expect(candidateOf(evidence, '7.0.0').urgentReason).toBeNull()
    expect(hardCodes(candidateOf(evidence, '7.0.0'))).toEqual(['too-new'])
    expect(evaluation.eligible).not.toContain('7.0.0')
    expect(evaluation.shortlist[0]).toBe('6.16.0')
  })

  test('a new major keeps the 3 day soak and ranks after the urgent fixes', () => {
    const evidence = brokenStable([
      {version: '6.16.0', ageDays: 20},
      {version: '6.23.0', ageDays: 10},
      {version: '7.0.0', ageDays: NEW_MAJOR_SOAK_DAYS},
    ])
    expect(evaluate(evidence).eligible).toEqual(['6.16.0', '6.23.0', '7.0.0'])
  })

  test('urgent fixes rank oldest first', () => {
    const evidence = makeEvidence(
      [
        {version: '6.16.0', ageDays: 20},
        {version: '6.17.0', ageDays: 10},
        {version: '6.18.0', ageDays: 9},
      ],
      withRegressions([regression({introducedIn: '6.14.0', fixedIn: '6.16.0'})]),
    )
    expect(evaluate(evidence).eligible).toEqual(['6.16.0', '6.17.0', '6.18.0'])
  })
})

describe('above current latest', () => {
  const releases: ReleaseInput[] = [
    {version: '6.22.0', ageDays: 10},
    {version: '6.23.0', ageDays: 10},
  ]

  test('live mode excludes any version above dist-tags latest', () => {
    const evidence = makeEvidence(releases, {latest: '6.22.0'})
    expect(hardCodes(candidateOf(evidence, '6.23.0'))).toEqual(['rolled-back'])
    expect(candidateOf(evidence, '6.23.0').hard[0]?.detail).toBe('above current latest 6.22.0')
    expect(evaluate(evidence).eligible).toEqual(['6.22.0'])
  })

  test('as-of mode does not apply it', () => {
    const evidence = makeEvidence(releases, {mode: 'as-of', latest: '6.22.0'})
    expect(hardCodes(candidateOf(evidence, '6.23.0'))).toEqual([])
  })

  test('applies even when the tag-latest history is empty or unavailable', () => {
    const unavailable = makeEvidence(releases, {
      latest: '6.22.0',
      latestMoves: {status: 'unavailable', error: 'down'},
    })
    expect(hardCodes(candidateOf(unavailable, '6.23.0'))).toEqual(['rolled-back'])
  })
})
