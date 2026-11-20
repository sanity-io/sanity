import {isDeepStrictEqual} from 'node:util'

import {describe, expect, test} from 'vitest'

import {loadHistoryFixture} from './__fixtures__/load'
import {truncateHistory, viewAsOf} from './asOf'
import {evaluate} from './rules'
import {type Evidence, type History} from './types'

const history = loadHistoryFixture()

function backtestTuesdays(): string[] {
  const first = Date.parse('2025-12-09T18:00:00Z')
  const last = Date.parse('2026-11-17T18:00:00Z')
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return Array.from({length: Math.floor((last - first) / weekMs) + 1}, (_, index) =>
    new Date(first + index * weekMs).toISOString().replace('.000Z', 'Z'),
  )
}

function confirmedCount(evidence: Evidence): number {
  return evidence.regressions.status === 'ok' ? evidence.regressions.data.confirmed.length : -1
}

describe('viewAsOf current stable and latest', () => {
  test('stable at 2026-09-01 is 6.7.0', () => {
    expect(viewAsOf(history, '2026-09-01T18:00:00Z', 'as-of').currentStable).toBe('6.7.0')
  })

  test('stable at 2026-09-30 is 6.15.0, promoted on 2026-09-29', () => {
    const evidence = viewAsOf(history, '2026-09-30T18:00:00Z', 'as-of')
    expect(evidence.currentStable).toBe('6.15.0')
    expect(evidence.currentStableSince).toBe('2026-09-29T17:02:35Z')
  })

  test('latest is the highest release published by then', () => {
    expect(viewAsOf(history, '2026-09-01T18:00:00Z', 'as-of').latest).toBe('6.12.0')
    expect(viewAsOf(history, '2026-11-17T18:10:00Z', 'as-of').latest).toBe('6.24.0')
  })

  test('lists only candidate versions newer than stable, published by then', () => {
    const evidence = viewAsOf(history, '2026-09-30T18:00:00Z', 'as-of')
    expect(evidence.versions.map((entry) => entry.version)).toEqual(['6.16.0', '6.17.0'])
    expect(evidence.published.map((entry) => entry.version)).not.toContain('6.18.0')
  })
})

describe('viewAsOf package set', () => {
  test('2026-08-25 excludes @sanity/validation', () => {
    const evidence = viewAsOf(history, '2026-08-25T18:00:00Z', 'as-of')
    expect(evidence.packageSet.source).toBe('as-of-inferred')
    expect(evidence.packageSet.names).not.toContain('@sanity/validation')
  })

  test('2026-09-01T18:00Z includes @sanity/validation', () => {
    expect(viewAsOf(history, '2026-09-01T18:00:00Z', 'as-of').packageSet.names).toContain(
      '@sanity/validation',
    )
  })

  test('each candidate lists the packages that carry it', () => {
    const evidence = viewAsOf(history, '2026-09-01T18:00:00Z', 'as-of')
    const latest = evidence.versions.find((entry) => entry.version === '6.12.0')
    expect(latest?.packagesWithVersion).toEqual(
      expect.arrayContaining(['sanity', '@sanity/validation']),
    )
  })

  test('live mode uses the repo package names untouched', () => {
    const evidence = viewAsOf(history, history.fetchedAt, 'live')
    expect(evidence.packageSet).toEqual({names: history.repoPackageNames, source: 'repo'})
  })
})

describe('viewAsOf regressions', () => {
  function investigationRanges(evidence: Evidence): string[] {
    return evidence.regressions.status === 'ok'
      ? evidence.regressions.data.investigations
          .map((entry) => `${entry.goodVersion}-${entry.badVersion}`)
          .toSorted()
      : []
  }

  test('none are confirmed at 2026-09-15, three investigations are open', () => {
    const evidence = viewAsOf(history, '2026-09-15T18:00:00Z', 'as-of')
    expect(confirmedCount(evidence)).toBe(0)
    expect(investigationRanges(evidence)).toEqual([
      '6.11.0-6.13.1',
      '6.11.0-6.13.2',
      '6.7.0-6.12.0',
    ])
  })

  test('a session confirmed later is still an open investigation before that', () => {
    const early = viewAsOf(history, '2026-09-15T18:00:00Z', 'as-of')
    expect(investigationRanges(early)).toContain('6.11.0-6.13.1')
    const late = viewAsOf(history, '2026-09-22T18:00:00Z', 'as-of')
    expect(investigationRanges(late)).not.toContain('6.11.0-6.13.1')
  })

  test('live mode lists only sessions that are unresolved today', () => {
    const evidence = viewAsOf(history, '2026-11-20T13:00:00Z', 'live')
    expect(investigationRanges(evidence)).toEqual(['6.11.0-6.13.2', '6.7.0-6.12.0'])
  })

  test('all five are known at 2026-09-22T18:00Z', () => {
    expect(confirmedCount(viewAsOf(history, '2026-09-22T18:00:00Z', 'as-of'))).toBe(5)
  })

  test('a fix published after the instant is ignored', () => {
    const futureFix: History = {
      ...history,
      regressions:
        history.regressions.status === 'ok'
          ? {
              status: 'ok',
              data: {
                ...history.regressions.data,
                confirmed: history.regressions.data.confirmed.map((record) => ({
                  ...record,
                  fixedIn: '6.24.0',
                })),
              },
            }
          : history.regressions,
    }
    const evidence = viewAsOf(futureFix, '2026-09-22T18:00:00Z', 'as-of')
    const fixedIns =
      evidence.regressions.status === 'ok'
        ? evidence.regressions.data.confirmed.map((record) => record.fixedIn)
        : []
    expect(fixedIns).toEqual([null, null, null, null, null])
    const published = viewAsOf(futureFix, '2026-11-17T18:10:00Z', 'as-of')
    expect(
      published.regressions.status === 'ok' && published.regressions.data.confirmed[0]?.fixedIn,
    ).toBe('6.24.0')
  })

  test('live mode keeps every confirmed regression regardless of knownAt', () => {
    expect(confirmedCount(viewAsOf(history, '2026-09-01T00:00:00Z', 'live'))).toBe(5)
  })

  test('an unavailable source stays unavailable', () => {
    const unavailable: History = {
      ...history,
      regressions: {status: 'unavailable', error: 'no token'},
    }
    expect(viewAsOf(unavailable, '2026-09-22T18:00:00Z', 'as-of').regressions).toEqual({
      status: 'unavailable',
      error: 'no token',
    })
  })
})

describe('viewAsOf mode differences', () => {
  test('as-of nulls deprecation and drops downloads', () => {
    const deprecatedHistory: History = {
      ...history,
      sanityVersions: history.sanityVersions.map((entry) =>
        entry.version === '6.16.0' ? {...entry, deprecated: 'withdrawn'} : entry,
      ),
    }
    const asOfEvidence = viewAsOf(deprecatedHistory, '2026-09-30T18:00:00Z', 'as-of')
    expect(asOfEvidence.deprecationKnown).toBe(false)
    expect(asOfEvidence.versions.every((entry) => entry.deprecated === null)).toBe(true)
    expect(asOfEvidence.downloads).toEqual({status: 'not-applicable'})

    const live = viewAsOf(deprecatedHistory, deprecatedHistory.fetchedAt, 'live')
    expect(live.deprecationKnown).toBe(true)
    expect(live.versions.find((entry) => entry.version === '6.16.0')?.deprecated).toBe('withdrawn')
    expect(live.downloads).toEqual(history.liveDownloads)
    expect(live.currentStable).toBe('6.15.0')
    expect(live.latest).toBe('6.24.0')
  })

  test('SQRL, bench and issues are limited to what existed at the instant', () => {
    const early = viewAsOf(history, '2026-10-22T00:00:00Z', 'as-of')
    expect(
      early.sqrl.status === 'ok' &&
        early.sqrl.data.every((entry) => entry.createdAt <= '2026-10-22T00:00:00Z'),
    ).toBe(true)
    expect(
      early.sqrl.status === 'ok' && early.sqrl.data.map((entry) => entry.version),
    ).not.toContain('6.23.0')
    expect(
      early.issues.status === 'ok' &&
        early.issues.data.every((issue) => issue.createdAt <= '2026-10-22T00:00:00Z'),
    ).toBe(true)
  })

  test('issue state is computed at the instant', () => {
    const closedIssue =
      history.issues.status === 'ok'
        ? history.issues.data.find((issue) => issue.closedAt !== null)
        : undefined
    if (!closedIssue?.closedAt) throw new Error('fixture needs a closed issue')
    const beforeClose = new Date(Date.parse(closedIssue.closedAt) - 1000).toISOString()
    const afterClose = new Date(Date.parse(closedIssue.closedAt) + 1000).toISOString()
    const seen = (instant: string) => {
      const evidence = viewAsOf(history, instant, 'as-of')
      return evidence.issues.status === 'ok'
        ? evidence.issues.data.find((issue) => issue.number === closedIssue.number)
        : undefined
    }
    expect(seen(beforeClose)?.closedAt ?? null).toBeNull()
    expect(seen(afterClose)?.closedAt).toBe(closedIssue.closedAt)
  })

  test('throws when the promotion history is unavailable', () => {
    const noPromotions: History = {
      ...history,
      stablePromotions: {status: 'unavailable', error: 'x'},
    }
    expect(() => viewAsOf(noPromotions, '2026-09-01T18:00:00Z', 'as-of')).toThrow(/promotion/)
    expect(viewAsOf(noPromotions, noPromotions.fetchedAt, 'live').currentStableSince).toBeNull()
  })

  test('throws when nothing was published yet', () => {
    expect(() => viewAsOf(history, '2020-01-01T00:00:00Z', 'as-of')).toThrow(/published/)
  })
})

describe('leakage property', () => {
  test.each(backtestTuesdays())(
    'viewAsOf is unchanged by truncating the history at %s',
    (instant) => {
      expect(viewAsOf(history, instant, 'as-of')).toEqual(
        viewAsOf(truncateHistory(history, instant), instant, 'as-of'),
      )
    },
  )

  test('truncateHistory drops every record newer than the instant', () => {
    const instant = '2026-09-22T18:00:00Z'
    const truncated = truncateHistory(history, instant)
    expect(truncated.sanityVersions.every((entry) => entry.publishedAt <= instant)).toBe(true)
    expect(
      truncated.stablePromotions.status === 'ok' &&
        truncated.stablePromotions.data.every((entry) => entry.at <= instant),
    ).toBe(true)
    expect(truncated.sqrl.status === 'ok' && truncated.sqrl.data).toEqual([])
    expect(truncated.packageVersions.sanity).not.toContain('6.24.0')
    expect(truncated.fetchedAt).toBe(instant)
  })
})

describe('leakage property catches live-only reads', () => {
  const instant = '2026-09-22T18:00:00Z'

  function equalsAfterTruncation(view: (source: History, asOf: string) => Evidence): boolean {
    return isDeepStrictEqual(
      view(history, instant),
      view(truncateHistory(history, instant), instant),
    )
  }

  test('the real viewAsOf passes', () => {
    expect(equalsAfterTruncation((source, asOf) => viewAsOf(source, asOf, 'as-of'))).toBe(true)
  })

  test('a variant that reads liveDistTags fails', () => {
    const leaky = (source: History, asOf: string): Evidence => ({
      ...viewAsOf(source, asOf, 'as-of'),
      latest: source.liveDistTags.latest,
    })
    expect(equalsAfterTruncation(leaky)).toBe(false)
  })

  test('a variant that reads deprecation fails', () => {
    const leaky = (source: History, asOf: string): Evidence => {
      const evidence = viewAsOf(source, asOf, 'as-of')
      return {
        ...evidence,
        versions: evidence.versions.map((entry) => ({
          ...entry,
          deprecated:
            source.sanityVersions.find((item) => item.version === entry.version)?.deprecated ??
            null,
        })),
      }
    }
    expect(equalsAfterTruncation(leaky)).toBe(false)
  })

  test('a variant that reads downloads or stable tags fails', () => {
    const readsDownloads = (source: History, asOf: string): Evidence => ({
      ...viewAsOf(source, asOf, 'as-of'),
      downloads: source.liveDownloads,
    })
    const readsTags = (source: History, asOf: string): Evidence => ({
      ...viewAsOf(source, asOf, 'as-of'),
      stableByPackage: source.stableByPackage,
    })
    expect(equalsAfterTruncation(readsDownloads)).toBe(false)
    expect(equalsAfterTruncation(readsTags)).toBe(false)
  })
})

describe('latest moves and stable tags', () => {
  const MOVE_AT = '2026-06-10T18:24:24Z'

  test('a move after the instant is ignored in as-of mode', () => {
    const before = viewAsOf(history, '2026-06-09T18:00:00Z', 'as-of')
    expect(before.latestMoves).toEqual({status: 'ok', data: []})
    const after = viewAsOf(history, '2026-06-16T18:00:00Z', 'as-of')
    expect(after.latestMoves).toEqual({status: 'ok', data: [{version: '5.31.1', at: MOVE_AT}]})
  })

  test('truncateHistory drops moves newer than the instant', () => {
    expect(truncateHistory(history, '2026-06-09T18:00:00Z').latestMoves).toEqual({
      status: 'ok',
      data: [],
    })
  })

  test('the recorded 5.31.1 move never rolls back a version', () => {
    const rolledBack = backtestTuesdays().filter((instant) =>
      evaluate(viewAsOf(history, instant, 'as-of')).candidates.some((candidate) =>
        candidate.hard.some((verdict) => verdict.code === 'rolled-back'),
      ),
    )
    expect(rolledBack).toEqual([])
  })

  test('as-of mode marks stable tags not applicable and live mode carries them', () => {
    expect(viewAsOf(history, '2026-09-30T18:00:00Z', 'as-of').stableByPackage).toEqual({
      status: 'not-applicable',
    })
    expect(viewAsOf(history, '2026-11-20T13:00:00Z', 'live').stableByPackage).toEqual(
      history.stableByPackage,
    )
  })

  test('a history without these fields reports them as unavailable', () => {
    const {latestMoves: _moves, stableByPackage: _tags, ...legacy} = history
    const evidence = viewAsOf(legacy, '2026-11-20T13:00:00Z', 'live')
    expect(evidence.latestMoves?.status).toBe('unavailable')
    expect(evidence.stableByPackage?.status).toBe('unavailable')
  })
})
