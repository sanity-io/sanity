import {describe, expect, test} from 'vitest'

import {type Evidence, type History, type RegressionRecord} from '../types'
import {type BacktestInput, scoreBacktest} from './score'

const PACKAGES = ['sanity', '@sanity/types']

function evidenceAt(asOf: string, overrides: Partial<Evidence> = {}): Evidence {
  return {
    schemaVersion: 1,
    mode: 'as-of',
    asOf,
    currentStable: '6.7.0',
    currentStableSince: null,
    latest: '6.12.0',
    deprecationKnown: false,
    published: [
      {version: '6.7.0', publishedAt: '2026-07-01T10:00:00Z'},
      {version: '6.9.1', publishedAt: '2026-08-01T10:00:00Z'},
      {version: '6.9.2', publishedAt: '2026-08-05T10:00:00Z'},
      {version: '6.10.0', publishedAt: '2026-08-10T10:00:00Z'},
      {version: '6.11.0', publishedAt: '2026-08-12T10:00:00Z'},
      {version: '6.12.0', publishedAt: '2026-08-14T10:00:00Z'},
    ],
    versions: ['6.9.1', '6.9.2', '6.10.0', '6.11.0', '6.12.0'].map((version) => ({
      version,
      publishedAt: '2026-08-01T10:00:00Z',
      deprecated: null,
      packagesWithVersion: PACKAGES,
    })),
    packageSet: {names: PACKAGES, source: 'as-of-inferred'},
    regressions: {status: 'ok', data: {confirmed: [], investigations: []}},
    sqrl: {status: 'ok', data: []},
    issues: {status: 'ok', data: []},
    downloads: {status: 'not-applicable'},
    releaseBench: {status: 'ok', data: []},
    latestMoves: {status: 'ok', data: []},
    ...overrides,
  }
}

function inputAt(asOf: string, shortlist: string[], extra: Partial<BacktestInput> = {}) {
  return {
    asOf,
    currentStable: '6.7.0',
    eligibleCount: shortlist.length,
    shortlist,
    leakageOk: true,
    notes: [],
    ...extra,
  }
}

function regression(overrides: Partial<RegressionRecord> = {}): RegressionRecord {
  return {
    id: 'regression-1',
    introducedIn: '6.9.2',
    fixedIn: null,
    severity: 'major',
    knownAt: '2026-09-21T10:00:00Z',
    label: 'v6.9.1 → v6.9.2',
    ...overrides,
  }
}

const AS_OF = '2026-09-01T18:00:00Z'

function historyFor(evidence: Evidence, overrides: Partial<History> = {}): History {
  const factsFor = (version: string) => evidence.versions.find((entry) => entry.version === version)
  return {
    fetchedAt: evidence.asOf,
    sanityVersions: evidence.published.map((entry) => ({...entry, deprecated: null})),
    packageVersions: Object.fromEntries(
      evidence.packageSet.names.map((name) => [
        name,
        evidence.published
          .map((entry) => entry.version)
          .filter((version) => {
            const facts = factsFor(version)
            return facts === undefined || facts.packagesWithVersion.includes(name)
          }),
      ]),
    ),
    repoPackageNames: evidence.packageSet.names,
    liveDistTags: {latest: '0.0.0', stable: '0.0.0'},
    liveDownloads: {status: 'unavailable', error: 'not used'},
    stablePromotions: {
      status: 'ok',
      data: [{version: evidence.currentStable, at: '2020-01-01T00:00:00Z'}],
    },
    regressions: evidence.regressions,
    sqrl: {status: 'ok', data: []},
    releaseBench: {status: 'ok', data: []},
    issues: {status: 'ok', data: []},
    ...overrides,
  }
}

const DEFAULT_HISTORY = historyFor(evidenceAt(AS_OF))

function score(shortlist: string[], evidence: Evidence) {
  return scoreBacktest(
    [inputAt(evidence.asOf, shortlist)],
    {[evidence.asOf]: evidence},
    historyFor(evidence),
  )
}

describe('P1 independent hard rules', () => {
  test('passes a clean shortlist', () => {
    expect(score(['6.12.0', '6.9.2'].slice(0, 1), evidenceAt(AS_OF)).p1.pass).toBe(true)
  })

  test('fails a superseded version', () => {
    const result = score(['6.9.1'], evidenceAt(AS_OF))
    expect(result.p1.pass).toBe(false)
    expect(result.p1.violations[0]?.reasons).toContain('superseded')
  })

  test('fails a version still inside the soak window', () => {
    const evidence = evidenceAt('2026-08-18T10:00:00Z')
    const result = score(['6.12.0'], evidence)
    expect(result.p1.violations[0]?.reasons).toContain('too-new')
  })

  test('passes a version exactly at the soak boundary', () => {
    const evidence = evidenceAt('2026-08-21T10:00:00Z')
    expect(score(['6.12.0'], evidence).p1.pass).toBe(true)
  })

  test('applies the 3 day soak to a new major and 7 days to the same major', () => {
    const publishedAt = '2026-08-18T10:00:00Z'
    const withMajor = (asOf: string) =>
      evidenceAt(asOf, {
        published: [
          {version: '6.7.0', publishedAt: '2026-07-01T10:00:00Z'},
          {version: '7.0.0', publishedAt},
        ],
        versions: [
          {version: '7.0.0', publishedAt, deprecated: null, packagesWithVersion: PACKAGES},
        ],
      })
    expect(score(['7.0.0'], withMajor('2026-08-21T10:00:00Z')).p1.pass).toBe(true)
    expect(
      score(['7.0.0'], withMajor('2026-08-21T09:59:59.999Z')).p1.violations[0]?.reasons,
    ).toContain('too-new')
    expect(
      score(['6.12.0'], evidenceAt('2026-08-17T10:00:00Z')).p1.violations[0]?.reasons,
    ).toContain('too-new')
  })

  test('applies the 1 day urgent soak to a patch of stable only', () => {
    const publishedAt = '2026-08-18T10:00:00Z'
    const withPatch = (asOf: string) =>
      evidenceAt(asOf, {
        published: [
          {version: '6.7.0', publishedAt: '2026-07-01T10:00:00Z'},
          {version: '6.7.1', publishedAt},
          {version: '6.8.0', publishedAt},
        ],
        versions: ['6.7.1', '6.8.0'].map((version) => ({
          version,
          publishedAt,
          deprecated: null,
          packagesWithVersion: PACKAGES,
        })),
      })
    expect(score(['6.7.1'], withPatch('2026-08-19T10:00:00Z')).p1.pass).toBe(true)
    expect(score(['6.7.1'], withPatch('2026-08-19T09:59:59.999Z')).p1.pass).toBe(false)
    expect(score(['6.8.0'], withPatch('2026-08-19T10:00:00Z')).p1.violations[0]?.reasons).toContain(
      'too-new',
    )
  })

  test('applies the 1 day urgent soak to a fix of a broken stable', () => {
    const publishedAt = '2026-08-18T10:00:00Z'
    const withFix = (fixedIn: string | null, asOf: string) =>
      evidenceAt(asOf, {
        published: [
          {version: '6.7.0', publishedAt: '2026-07-01T10:00:00Z'},
          {version: '6.8.0', publishedAt},
        ],
        versions: [
          {version: '6.8.0', publishedAt, deprecated: null, packagesWithVersion: PACKAGES},
        ],
        regressions: {
          status: 'ok',
          data: {
            confirmed: [
              regression({introducedIn: '6.7.0', fixedIn, knownAt: '2026-08-01T00:00:00Z'}),
            ],
            investigations: [],
          },
        },
      })
    expect(score(['6.8.0'], withFix('6.8.0', '2026-08-19T10:00:00Z')).p1.pass).toBe(true)
    expect(
      score(['6.8.0'], withFix(null, '2026-08-19T10:00:00Z')).p1.violations[0]?.reasons,
    ).toContain('too-new')
  })

  test('fails a version rolled back by a tag-latest move', () => {
    const move = {version: '6.9.2', at: '2026-08-20T10:00:00Z'}
    const rolledBack = (moves: {version: string; at: string}[]) =>
      score(['6.12.0'], evidenceAt(AS_OF, {latestMoves: {status: 'ok', data: moves}}))
    expect(rolledBack([move]).p1.violations[0]?.reasons).toContain('rolled-back')
    expect(rolledBack([{...move, version: '6.12.0'}]).p1.pass).toBe(true)
    expect(rolledBack([{...move, at: '2026-08-13T10:00:00Z'}]).p1.pass).toBe(true)
    expect(rolledBack([{...move, at: '2026-09-02T10:00:00Z'}]).p1.pass).toBe(true)
    expect(rolledBack([move, {version: '6.12.0', at: '2026-08-25T10:00:00Z'}]).p1.pass).toBe(true)
  })

  test('keeps the 3 day soak for a new major even when stable is broken', () => {
    const publishedAt = '2026-08-18T10:00:00Z'
    const evidence = evidenceAt('2026-08-19T22:00:00Z', {
      published: [
        {version: '6.7.0', publishedAt: '2026-07-01T10:00:00Z'},
        {version: '7.0.0', publishedAt},
      ],
      versions: [{version: '7.0.0', publishedAt, deprecated: null, packagesWithVersion: PACKAGES}],
      regressions: {
        status: 'ok',
        data: {
          confirmed: [
            regression({introducedIn: '6.7.0', fixedIn: '6.8.0', knownAt: '2026-08-01T00:00:00Z'}),
          ],
          investigations: [],
        },
      },
    })
    expect(score(['7.0.0'], evidence).p1.violations[0]?.reasons).toContain('too-new')
  })

  test('fails a version above the live latest', () => {
    const evidence = evidenceAt(AS_OF, {mode: 'live', latest: '6.11.0'})
    const history = historyFor(evidence, {
      liveDistTags: {latest: '6.11.0', stable: '6.7.0'},
      repoPackageNames: PACKAGES,
    })
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {[AS_OF]: evidence}, history)
    expect(result.p1.violations[0]?.reasons).toContain('rolled-back')
  })

  test('fails a version missing a package', () => {
    const evidence = evidenceAt(AS_OF)
    const history = historyFor(evidence, {
      packageVersions: {
        'sanity': ['6.7.0', '6.12.0', '6.13.0'],
        '@sanity/types': ['6.7.0', '6.13.0'],
      },
      sanityVersions: [
        ...evidence.published.map((entry) => ({...entry, deprecated: null})),
        {version: '6.13.0', publishedAt: '2026-08-20T10:00:00Z', deprecated: null},
      ],
    })
    const result = scoreBacktest(
      [inputAt(AS_OF, ['6.12.0'])],
      {
        [AS_OF]: {
          ...evidence,
          published: [
            ...evidence.published,
            {version: '6.13.0', publishedAt: '2026-08-20T10:00:00Z'},
          ],
        },
      },
      history,
    )
    expect(result.p1.violations[0]?.reasons).toContain('missing-packages')
  })

  test('derives stable from the promotion history and flags a disagreeing evidence', () => {
    const evidence = evidenceAt(AS_OF)
    const history = historyFor(evidence, {
      stablePromotions: {status: 'ok', data: [{version: '6.9.2', at: '2026-08-20T00:00:00Z'}]},
    })
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {[AS_OF]: evidence}, history)
    expect(result.p1.violations[0]?.reasons).toContain('stable-mismatch')
  })

  test('uses the derived stable for the not-newer-than-stable check', () => {
    const evidence = evidenceAt(AS_OF)
    const history = historyFor(evidence, {
      stablePromotions: {status: 'ok', data: [{version: '6.12.0', at: '2026-08-20T00:00:00Z'}]},
    })
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {[AS_OF]: evidence}, history)
    expect(result.p1.violations[0]?.reasons).toContain('not-newer-than-stable')
  })

  test('derives the package set from the packages that carry the latest version', () => {
    const evidence = evidenceAt(AS_OF)
    const history = historyFor(evidence, {
      packageVersions: {
        'sanity': ['6.7.0', '6.12.0'],
        '@sanity/types': ['6.7.0'],
      },
    })
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {[AS_OF]: evidence}, history)
    expect(result.p1.violations[0]?.reasons).toContain('package-set-mismatch')
  })

  test('a version absent from the history fails', () => {
    const evidence = evidenceAt(AS_OF)
    const history = historyFor(evidence, {
      sanityVersions: evidence.published
        .filter((entry) => entry.version !== '6.12.0')
        .map((entry) => ({...entry, deprecated: null})),
    })
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {[AS_OF]: evidence}, history)
    expect(result.p1.violations[0]?.reasons).toContain('missing-packages')
  })

  test('fails a version that is not newer than stable', () => {
    const evidence = evidenceAt(AS_OF, {currentStable: '6.12.0'})
    expect(score(['6.12.0'], evidence).p1.violations[0]?.reasons).toContain('not-newer-than-stable')
  })

  test('fails a version covered by a regression known at the date', () => {
    const evidence = evidenceAt('2026-09-22T00:00:00Z', {
      regressions: {status: 'ok', data: {confirmed: [regression()], investigations: []}},
    })
    expect(score(['6.12.0'], evidence).p1.violations[0]?.reasons).toContain('regression')
  })

  test('ignores a regression that was not yet known', () => {
    const evidence = evidenceAt(AS_OF, {
      regressions: {status: 'ok', data: {confirmed: [regression()], investigations: []}},
    })
    expect(score(['6.12.0'], evidence).p1.pass).toBe(true)
  })

  test('ignores a regression fixed by a published version', () => {
    const evidence = evidenceAt('2026-09-22T00:00:00Z', {
      regressions: {
        status: 'ok',
        data: {confirmed: [regression({fixedIn: '6.10.0'})], investigations: []},
      },
    })
    expect(score(['6.12.0'], evidence).p1.pass).toBe(true)
  })

  test('fails when regression data is unavailable', () => {
    const evidence = evidenceAt(AS_OF, {regressions: {status: 'unavailable', error: 'down'}})
    expect(score(['6.12.0'], evidence).p1.violations[0]?.reasons).toContain(
      'regression-data-unavailable',
    )
  })

  test('applies deprecation only when it is known', () => {
    const deprecated = [
      {
        version: '6.12.0',
        publishedAt: '2026-08-14T10:00:00Z',
        deprecated: 'bad',
        packagesWithVersion: PACKAGES,
      },
    ]
    expect(score(['6.12.0'], evidenceAt(AS_OF, {versions: deprecated})).p1.pass).toBe(true)
    expect(
      score(['6.12.0'], evidenceAt(AS_OF, {versions: deprecated, deprecationKnown: true})).p1
        .violations[0]?.reasons,
    ).toContain('deprecated')
  })

  test('fails when the evidence for a date is missing', () => {
    const result = scoreBacktest([inputAt(AS_OF, ['6.12.0'])], {}, DEFAULT_HISTORY)
    expect(result.p1.violations[0]?.reasons).toEqual(['no-evidence'])
  })

  test('passes an empty shortlist without evidence', () => {
    expect(scoreBacktest([inputAt(AS_OF, [])], {}, DEFAULT_HISTORY).p1.pass).toBe(true)
  })
})

describe('P2 leakage', () => {
  test('records failing dates', () => {
    const result = scoreBacktest(
      [inputAt('2026-08-25T18:00:00Z', [], {leakageOk: false}), inputAt(AS_OF, [])],
      {},
      DEFAULT_HISTORY,
    )
    expect(result.p2).toEqual({pass: false, failingDates: ['2026-08-25T18:00:00Z']})
  })
})

describe('P3 6.11.0 cutoff', () => {
  test('fails when shortlisted after the cutoff', () => {
    const result = scoreBacktest([inputAt('2026-09-01T18:00:00Z', ['6.11.0'])], {}, DEFAULT_HISTORY)
    expect(result.p3.pass).toBe(false)
    expect(result.p3.violations).toEqual(['2026-09-01T18:00:00Z'])
  })

  test('passes when shortlisted before the cutoff', () => {
    const result = scoreBacktest([inputAt('2026-08-25T18:00:00Z', ['6.11.0'])], {}, DEFAULT_HISTORY)
    expect(result.p3.pass).toBe(true)
  })

  test('passes when absent after the cutoff', () => {
    expect(
      scoreBacktest([inputAt('2026-09-08T18:00:00Z', ['6.12.0'])], {}, DEFAULT_HISTORY).p3.pass,
    ).toBe(true)
  })
})

describe('P4 known bad range exposure', () => {
  test('classifies shortlists outside the range as none', () => {
    const result = scoreBacktest([inputAt(AS_OF, ['6.8.0'])], {}, DEFAULT_HISTORY)
    expect(result.rows[0]?.exposure).toBe('none')
  })

  test('classifies exposure before any covering regression was known as unknowable', () => {
    const evidence = evidenceAt(AS_OF, {
      regressions: {status: 'ok', data: {confirmed: [regression()], investigations: []}},
    })
    const result = score(['6.12.0'], evidence)
    expect(result.rows[0]?.exposure).toBe('unknowable')
    expect(result.rows[0]?.exposedVersions).toEqual(['6.12.0'])
    expect(result.p4.unknowable).toBe(1)
  })

  test('classifies exposure after a covering regression was known as knowable', () => {
    const evidence = evidenceAt('2026-09-22T00:00:00Z', {
      regressions: {status: 'ok', data: {confirmed: [regression()], investigations: []}},
    })
    const result = score(['6.12.0'], evidence)
    expect(result.rows[0]?.exposure).toBe('knowable')
    expect(result.p4.knowable).toBe(1)
    expect(result.p4.exposures).toEqual([
      {asOf: '2026-09-22T00:00:00Z', versions: ['6.12.0'], classification: 'knowable'},
    ])
  })
})

describe('P5 agreement with human promotions', () => {
  const evidence = evidenceAt(AS_OF)
  const inputs = [
    inputAt('2026-09-01T18:00:00Z', ['6.12.0', '6.10.0'], {modelPick: '6.10.0'}),
    inputAt('2026-09-08T18:00:00Z', ['6.12.0', '6.10.0']),
    inputAt('2026-09-15T18:00:00Z', ['6.12.0']),
    inputAt('2026-09-22T18:00:00Z', ['6.12.0']),
  ]
  const result = scoreBacktest(
    inputs,
    {[AS_OF]: evidence},
    historyFor(evidence, {
      stablePromotions: {
        status: 'ok',
        data: [
          {version: '6.7.0', at: '2020-01-01T00:00:00Z'},
          {version: '6.10.0', at: '2026-09-03T12:00:00Z'},
          {version: '6.12.0', at: '2026-09-09T12:00:00Z'},
          {version: '6.9.2', at: '2026-09-15T18:00:00Z'},
        ],
      },
    }),
  )

  test('attaches the promotion inside the following seven days', () => {
    expect(result.rows.map((row) => row.humanPromotion?.version)).toEqual([
      '6.10.0',
      '6.12.0',
      '6.9.2',
      undefined,
    ])
  })

  test('counts shortlist and top pick agreement', () => {
    expect(result.p5).toEqual({
      datesWithHumanPromotion: 3,
      onShortlist: 2,
      topPick: 1,
      modelPickSamples: 1,
      modelPickMatches: 1,
    })
  })
})
