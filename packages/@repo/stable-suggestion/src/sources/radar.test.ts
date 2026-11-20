import {describe, expect, test} from 'vitest'

import {loadRawFixture} from '../__fixtures__/load'
import {
  deriveIntroducedIn,
  fetchRadarHistory,
  normaliseBench,
  normaliseRegressions,
  normaliseSqrl,
  stripVersionPrefix,
  type RadarBenchRow,
  type RadarClient,
  type RadarSession,
  type RadarSqrlRow,
  type RadarTag,
} from './radar'

const raw = loadRawFixture<{
  sessions: RadarSession[]
  tags: RadarTag[]
  sqrl: RadarSqrlRow[]
  bench: RadarBenchRow[]
}>('radar-raw')

function sessionBetween(good: string, bad: string): RadarSession {
  const session = raw.sessions.find((entry) => entry.good === good && entry.bad === bad)
  if (!session) throw new Error(`fixture is missing the ${good} to ${bad} session`)
  return session
}

function okRegressions(sessions: RadarSession[], tags: RadarTag[]) {
  const regressions = normaliseRegressions(sessions, tags)
  if (regressions.status === 'unavailable') throw new Error(regressions.error)
  return regressions.data
}

describe('deriveIntroducedIn', () => {
  test('the 6.9.1 to 6.9.2 session derives 6.9.2', () => {
    expect(deriveIntroducedIn(sessionBetween('v6.9.1', 'v6.9.2'), raw.tags)).toBe('6.9.2')
  })

  test('a session recorded on a later tag derives the tag that holds the first bad commit', () => {
    expect(deriveIntroducedIn(sessionBetween('v5.0.0', 'v6.14.0'), raw.tags)).toBe('6.9.2')
  })

  test('falls back to the bad label alone', () => {
    const bare: RadarSession = {
      ...sessionBetween('v6.9.1', 'v6.9.2'),
      bad: 'v6.13.2',
      firstBadSha: null,
      firstBadTag: null,
      firstBadCommittedAt: null,
    }
    expect(deriveIntroducedIn(bare, raw.tags)).toBe('6.13.2')
  })

  test('picks the earliest same-major tag cut after the first bad commit', () => {
    const session: RadarSession = {
      ...sessionBetween('v6.9.1', 'v6.9.2'),
      bad: 'v6.14.0',
      firstBadTag: null,
      firstBadCommittedAt: '2026-08-12T00:00:00Z',
    }
    const tags: RadarTag[] = [
      {tag: 'v6.10.0', sha: 'a', taggedAt: '2026-08-18T12:00:00Z', onMainline: true},
      {tag: 'v6.9.2', sha: 'b', taggedAt: '2026-08-11T12:00:00Z', onMainline: true},
      {tag: 'v5.9.0', sha: 'c', taggedAt: '2026-08-13T12:00:00Z', onMainline: true},
    ]
    expect(deriveIntroducedIn(session, tags)).toBe('6.10.0')
  })

  test('returns null when nothing can be derived', () => {
    expect(
      deriveIntroducedIn(
        {
          ...sessionBetween('v6.9.1', 'v6.9.2'),
          bad: null,
          firstBadTag: null,
          firstBadCommittedAt: null,
        },
        [],
      ),
    ).toBeNull()
  })
})

describe('normaliseRegressions', () => {
  const {confirmed, investigations} = okRegressions(raw.sessions, raw.tags)

  test('keeps the five confirmed regressions with labels from the session labels', () => {
    expect(confirmed).toHaveLength(5)
    expect(confirmed.map((record) => record.introducedIn).toSorted()).toEqual([
      '6.11.0',
      '6.13.0',
      '6.13.2',
      '6.9.2',
      '6.9.2',
    ])
    expect(confirmed.find((record) => record.label === 'v6.9.1 → v6.9.2')).toMatchObject({
      fixedIn: '6.14.1',
      severity: 'critical',
    })
  })

  test('uses the document update time as knownAt', () => {
    const session = sessionBetween('v6.9.1', 'v6.9.2')
    expect(confirmed.find((record) => record.id === session._id)?.knownAt).toBe(session._updatedAt)
  })

  test('keeps unclassified sessions with both labels as investigations', () => {
    expect(investigations.map((entry) => [entry.goodVersion, entry.badVersion])).toEqual(
      expect.arrayContaining([['6.7.0', '6.12.0']]),
    )
    expect(investigations.every((entry) => entry.knownAt.length > 0)).toBe(true)
  })

  test('never copies free text fields', () => {
    expect(Object.keys(confirmed[0] ?? {}).toSorted()).toEqual([
      'fixedIn',
      'id',
      'introducedIn',
      'knownAt',
      'label',
      'severity',
    ])
  })
})

describe('commit-endpoint regressions', () => {
  const commitSession: RadarSession = {
    _id: 'session-commit',
    _createdAt: '2026-09-10T10:00:00Z',
    _updatedAt: '2026-09-22T10:00:00Z',
    good: null,
    bad: null,
    regression: true,
    severity: 'major',
    fixedIn: null,
    firstBadSha: 'commit-sha',
    firstBadTag: null,
    firstBadCommittedAt: '2026-08-12T00:00:00Z',
  }
  const mainlineTags: RadarTag[] = [
    {tag: 'v6.9.2', sha: 'a', taggedAt: '2026-08-11T12:00:00Z', onMainline: true},
    {tag: 'v6.10.0', sha: 'b', taggedAt: '2026-08-18T12:00:00Z', onMainline: true},
    {tag: 'v6.11.0', sha: 'c', taggedAt: '2026-08-25T12:00:00Z', onMainline: true},
  ]

  test('attributes a commit endpoint to the first mainline tag after the commit', () => {
    expect(deriveIntroducedIn(commitSession, mainlineTags)).toBe('6.10.0')
    expect(okRegressions([commitSession], mainlineTags).confirmed).toMatchObject([
      {id: 'session-commit', introducedIn: '6.10.0'},
    ])
  })

  test('ignores an off-mainline tag cut between the commit and the next mainline tag', () => {
    const offMainline: RadarTag = {
      tag: 'v5.31.2',
      sha: 'd',
      taggedAt: '2026-08-13T12:00:00Z',
      onMainline: false,
    }
    expect(deriveIntroducedIn(commitSession, [...mainlineTags, offMainline])).toBe('6.10.0')
  })

  test('skips a regression whose commit no mainline tag contains yet', () => {
    const lateSession = {...commitSession, firstBadCommittedAt: '2026-09-01T00:00:00Z'}
    expect(deriveIntroducedIn(lateSession, mainlineTags)).toBeNull()
    expect(okRegressions([lateSession], mainlineTags).confirmed).toEqual([])
  })

  test('fails closed when the first bad commit is not synced', () => {
    const unsynced = {...commitSession, firstBadCommittedAt: null}
    const regressions = normaliseRegressions([unsynced], mainlineTags)
    expect(regressions).toMatchObject({status: 'unavailable'})
    expect(regressions.status === 'unavailable' ? regressions.error : '').toContain(
      'session-commit',
    )
  })
})

describe('normaliseRegressions investigations', () => {
  const session = {
    _id: 'session-open',
    _createdAt: '2026-09-10T10:00:00Z',
    _updatedAt: '2026-09-22T10:00:00Z',
    good: 'v6.11.0',
    bad: 'v6.13.1',
    regression: true,
    severity: 'major' as const,
    fixedIn: null,
    firstBadSha: null,
    firstBadTag: null,
    firstBadCommittedAt: null,
  }

  test('keeps a resolved session as an investigation with its resolution time', () => {
    const {investigations} = okRegressions([session], [])
    expect(investigations).toEqual([
      {
        id: 'session-open',
        goodVersion: '6.11.0',
        badVersion: '6.13.1',
        knownAt: '2026-09-10T10:00:00Z',
        resolvedAt: '2026-09-22T10:00:00Z',
      },
    ])
  })

  test('an unresolved session has no resolution time', () => {
    const {investigations} = okRegressions([{...session, regression: null}], [])
    expect(investigations[0]?.resolvedAt).toBeNull()
  })
})

describe('normaliseSqrl and normaliseBench', () => {
  test('joins SQRL rows to versions through the tag sha', () => {
    const facts = normaliseSqrl(raw.sqrl, raw.tags)
    expect(facts.map((entry) => entry.version)).toContain('6.23.0')
    const sixTwentyThree = facts.find((entry) => entry.version === '6.23.0')
    expect(sixTwentyThree?.regressedInputs).toEqual(['listeners'])
    expect(sixTwentyThree?.formulaVersion).toBe(1)
  })

  test('defaults missing numeric fields and skips rows without a score or tag', () => {
    const tags: RadarTag[] = [
      {tag: 'v1.0.0', sha: 'sha-1', taggedAt: '2026-01-01T00:00:00Z', onMainline: true},
    ]
    const facts = normaliseSqrl(
      [
        {
          _createdAt: 'x',
          sha: 'sha-1',
          score: 100,
          scoreCommit: null,
          formulaVersion: null,
          regressedInputs: null,
          reliabilityEvents: null,
        },
        {
          _createdAt: 'x',
          sha: 'sha-1',
          score: null,
          scoreCommit: null,
          formulaVersion: 1,
          regressedInputs: [],
          reliabilityEvents: 0,
        },
        {
          _createdAt: 'x',
          sha: 'unknown',
          score: 1,
          scoreCommit: 1,
          formulaVersion: 1,
          regressedInputs: [],
          reliabilityEvents: 0,
        },
      ],
      tags,
    )
    expect(facts).toEqual([
      {
        version: '1.0.0',
        score: 100,
        scoreCommit: 100,
        formulaVersion: 1,
        regressedInputs: [],
        reliabilityEvents: 0,
        createdAt: 'x',
      },
    ])
  })

  test('keeps the earliest release bench run per version', () => {
    const tags: RadarTag[] = [
      {tag: 'v1.0.0', sha: 'sha-1', taggedAt: '2026-01-01T00:00:00Z', onMainline: true},
    ]
    const bench = normaliseBench(
      [
        {
          _createdAt: '2026-01-02T00:00:00Z',
          sha: 'sha-1',
          calibrationMs: 2,
          initialJsBytes: null,
          totalJsBytes: 9,
        },
        {
          _createdAt: '2026-01-01T00:00:00Z',
          sha: 'sha-1',
          calibrationMs: 1,
          initialJsBytes: 5,
          totalJsBytes: 8,
        },
      ],
      tags,
    )
    expect(bench).toEqual([
      {
        version: '1.0.0',
        calibrationMs: 1,
        initialJsBytes: 5,
        totalJsBytes: 8,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ])
  })

  test('strips the tag prefix', () => {
    expect(stripVersionPrefix('v6.23.0')).toBe('6.23.0')
    expect(stripVersionPrefix('6.23.0')).toBe('6.23.0')
  })
})

describe('fetchRadarHistory', () => {
  test('marks everything unavailable without a client', async () => {
    const history = await fetchRadarHistory(null)
    expect(history.regressions.status).toBe('unavailable')
    expect(history.sqrl.status).toBe('unavailable')
    expect(history.releaseBench.status).toBe('unavailable')
  })

  test('marks everything unavailable when a query fails', async () => {
    const client: RadarClient = {fetch: async () => Promise.reject(new Error('unauthorized'))}
    const history = await fetchRadarHistory(client)
    expect(history.regressions).toEqual({status: 'unavailable', error: 'unauthorized'})
    expect(history.sqrl.status).toBe('unavailable')
    expect(history.releaseBench.status).toBe('unavailable')
  })

  test('normalises the four query results and passes tag shas to the metric queries', async () => {
    const paramsSeen: (Record<string, unknown> | undefined)[] = []
    const client: RadarClient = {
      fetch: async (query, params) => {
        paramsSeen.push(params)
        if (query.includes('bisectSession')) return raw.sessions
        if (query.includes('gitTag')) return raw.tags
        if (query.includes('sqrlScore')) return raw.sqrl
        return raw.bench
      },
    }
    const history = await fetchRadarHistory(client)
    expect(history.regressions.status).toBe('ok')
    expect(history.sqrl.status === 'ok' && history.sqrl.data.length).toBeGreaterThan(0)
    expect(
      history.releaseBench.status === 'ok' && history.releaseBench.data.length,
    ).toBeGreaterThan(0)
    expect(paramsSeen.filter(Boolean).every((params) => Array.isArray(params?.shas))).toBe(true)
  })
})
