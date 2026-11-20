import {describe, expect, test} from 'vitest'

import {loadRawFixture} from './__fixtures__/load'
import {fetchHistory} from './history'
import {type RadarClient} from './sources/radar'

type RawIssues = unknown[]

function fixtureFetch(): typeof fetch {
  const issues = loadRawFixture<RawIssues>('github-issues')
  return async (input) => {
    const url = decodeURIComponent(String(input))
    if (url === 'https://registry.npmjs.org/sanity') {
      return new Response(JSON.stringify(loadRawFixture('npm-packument')))
    }
    if (url.endsWith('/-/package/sanity/dist-tags')) {
      return new Response(JSON.stringify({latest: '6.24.0', stable: '6.15.0'}))
    }
    if (url.includes('api.npmjs.org')) {
      return new Response(JSON.stringify(loadRawFixture('npm-downloads')))
    }
    if (url.startsWith('https://registry.npmjs.org/')) {
      return new Response(JSON.stringify({versions: {'6.12.0': {}, '6.13.0-next.1': {}}}))
    }
    if (url.includes('/actions/workflows/tag-stable.yml/runs')) {
      return new Response(JSON.stringify({workflow_runs: loadRawFixture('github-runs')}))
    }
    if (
      url.includes('/actions/workflows/suggest-stable.yml/runs') ||
      url.includes('/actions/workflows/tag-latest.yml/runs')
    ) {
      return new Response(JSON.stringify({workflow_runs: []}))
    }
    if (url.includes('/search/issues')) {
      return new Response(JSON.stringify({total_count: issues.length, items: issues}))
    }
    return new Response('not found', {status: 404})
  }
}

const emptyRadar: RadarClient = {fetch: async () => []}

describe('fetchHistory', () => {
  test('assembles every source once', async () => {
    const history = await fetchHistory({
      fetchImpl: fixtureFetch(),
      radarClient: emptyRadar,
      githubToken: 'token',
      issuesFrom: new Date('2026-11-01T00:00:00Z'),
      now: new Date('2026-11-20T00:00:00Z'),
      repoPackageNames: ['sanity', '@sanity/validation'],
    })
    expect(history.fetchedAt).toBe('2026-11-20T00:00:00.000Z')
    expect(history.liveDistTags).toEqual({latest: '6.24.0', stable: '6.15.0'})
    expect(history.packageVersions['@sanity/validation']).toEqual(['6.12.0'])
    expect(history.packageVersions.sanity).toContain('6.9.2')
    expect(history.stablePromotions.status).toBe('ok')
    expect(history.latestMoves).toEqual({status: 'ok', data: []})
    expect(history.stableByPackage).toEqual({
      status: 'ok',
      data: {'sanity': '6.15.0', '@sanity/validation': null},
    })
    expect(history.issues.status).toBe('ok')
    expect(history.regressions).toEqual({status: 'ok', data: {confirmed: [], investigations: []}})
    expect(history.liveDownloads.status).toBe('ok')
  })

  test('degrades GitHub and Radar to unavailable without failing', async () => {
    const history = await fetchHistory({
      fetchImpl: fixtureFetch(),
      radarClient: null,
      githubToken: null,
      issuesFrom: new Date('2026-11-01T00:00:00Z'),
      repoPackageNames: ['sanity'],
    })
    expect(history.stablePromotions.status).toBe('unavailable')
    expect(history.issues.status).toBe('unavailable')
    expect(history.regressions.status).toBe('unavailable')
    expect(history.sqrl.status).toBe('unavailable')
  })

  test('fails when npm fails', async () => {
    await expect(
      fetchHistory({
        fetchImpl: async () => new Response('down', {status: 503}),
        radarClient: null,
        githubToken: null,
        issuesFrom: new Date('2026-11-01T00:00:00Z'),
        repoPackageNames: ['sanity'],
      }),
    ).rejects.toThrow(/503/)
  })

  test('marks downloads unavailable when that endpoint fails', async () => {
    const base = fixtureFetch()
    const history = await fetchHistory({
      fetchImpl: async (input, init) =>
        String(input).includes('api.npmjs.org')
          ? new Response('x', {status: 500})
          : base(input, init),
      radarClient: null,
      githubToken: null,
      issuesFrom: new Date('2026-11-01T00:00:00Z'),
      repoPackageNames: ['sanity'],
    })
    expect(history.liveDownloads.status).toBe('unavailable')
  })
})
