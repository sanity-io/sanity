import {describe, expect, test} from 'vitest'

import {loadRawFixture} from '../__fixtures__/load'
import {
  fetchApprovals,
  fetchIssues,
  fetchStablePromotions,
  mentionsVersion,
  monthWindows,
  normaliseApprovals,
  normaliseAutomatedPromotions,
  normaliseIssues,
  normaliseLatestMoves,
  normalisePromotions,
  type GitHubDeps,
} from './github'

type RawIssues = Parameters<typeof normaliseIssues>[0]
type RawRuns = Parameters<typeof normalisePromotions>[0]

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {status: 200})
}

function depsFor(handler: (url: string) => Response): {deps: GitHubDeps; urls: string[]} {
  const urls: string[] = []
  return {
    urls,
    deps: {
      token: 'test-token',
      fetchImpl: async (input) => {
        urls.push(String(input))
        return handler(String(input))
      },
    },
  }
}

describe('mentionsVersion', () => {
  test('matches the exact version', () => {
    expect(mentionsVersion('Broke in 6.23.0 for us', '6.23.0')).toBe(true)
    expect(mentionsVersion('Broke in v6.23.0.', '6.23.0')).toBe(true)
    expect(mentionsVersion('(6.23.0)', '6.23.0')).toBe(true)
  })

  test.each(['6.23.0-next.1', '16.23.0', '6.23.01', 'sanity@6.23.0-beta', '6.23.0.1'])(
    'does not match %s',
    (text) => {
      expect(mentionsVersion(text, '6.23.0')).toBe(false)
    },
  )

  test('escapes dots in the version', () => {
    expect(mentionsVersion('6x23y0', '6.23.0')).toBe(false)
  })
})

describe('normalisePromotions', () => {
  const runs = loadRawFixture<RawRuns>('github-runs')

  test('keeps successful Tag @stable runs, oldest first', () => {
    const promotions = normalisePromotions(runs)
    expect(promotions.at(-1)).toMatchObject({version: '6.15.0'})
    expect(promotions.map((entry) => entry.at)).toEqual(
      promotions.map((entry) => entry.at).toSorted(),
    )
  })

  test('ignores failures and other titles', () => {
    expect(
      normalisePromotions([
        {
          display_title: 'Tag @stable - 6.1.0',
          created_at: '2026-06-25T08:34:00Z',
          conclusion: 'failure',
        },
        {
          display_title: 'Tag @latest - 6.1.0',
          created_at: '2026-06-25T09:00:00Z',
          conclusion: 'success',
        },
        {
          display_title: 'Tag @stable - 6.1.0-next.1',
          created_at: '2026-06-25T09:10:00Z',
          conclusion: 'success',
        },
        {
          display_title: 'Tag @stable - 6.1.0',
          created_at: '2026-06-25T09:37:00Z',
          conclusion: 'success',
        },
      ]),
    ).toEqual([{version: '6.1.0', at: '2026-06-25T09:37:00Z'}])
  })
})

describe('normaliseIssues', () => {
  const issues = normaliseIssues(loadRawFixture<RawIssues>('github-issues'), [
    '6.20.0',
    '6.21.0',
    '6.22.0',
    '6.23.0',
    '6.24.0',
  ])

  test('drops pull requests and computes mentioned versions from title and body', () => {
    expect(issues.map((issue) => issue.number)).toEqual([15612, 15773, 15874, 16063, 16212])
    expect(issues.find((issue) => issue.number === 16063)?.versionsMentioned).toEqual([
      '6.21.0',
      '6.23.0',
    ])
  })

  test('does not count lookalike versions', () => {
    expect(issues.find((issue) => issue.number === 15612)?.versionsMentioned).toEqual(['6.20.0'])
  })

  test('keeps labels and state', () => {
    expect(issues.find((issue) => issue.number === 16212)?.labels).toEqual(['Feature'])
    expect(issues.find((issue) => issue.number === 15874)?.closedAt).toBe('2026-11-11T13:51:18Z')
    expect(issues.find((issue) => issue.number === 15773)?.closedAt).toBeNull()
  })
})

describe('normaliseApprovals', () => {
  test('maps candidate environments to slots', () => {
    expect(
      normaliseApprovals([
        {
          state: 'approved',
          comment: 'ship it',
          user: {login: 'reviewer'},
          environments: [{name: 'stable-candidate-2'}, {name: 'other-env'}],
        },
        {
          state: 'rejected',
          comment: null,
          user: null,
          environments: [{name: 'stable-candidate-1'}, {name: 'stable-candidate-3'}],
        },
      ]),
    ).toEqual([
      {login: 'reviewer', comment: 'ship it', state: 'approved', slots: [2]},
      {login: 'unknown', comment: '', state: 'rejected', slots: [1, 3]},
    ])
  })
})

describe('monthWindows', () => {
  test('covers the range with month sized windows clipped to the bounds', () => {
    const windows = monthWindows(new Date('2026-01-15T00:00:00Z'), new Date('2026-03-10T12:00:00Z'))
    expect(windows.map((window) => [window.start.toISOString(), window.end.toISOString()])).toEqual(
      [
        ['2026-01-15T00:00:00.000Z', '2026-01-31T23:59:59.000Z'],
        ['2026-02-01T00:00:00.000Z', '2026-02-28T23:59:59.000Z'],
        ['2026-03-01T00:00:00.000Z', '2026-03-10T12:00:00.000Z'],
      ],
    )
  })
})

describe('github fetchers', () => {
  test('fetchStablePromotions requests successful runs and normalises them', async () => {
    const {deps, urls} = depsFor((url) =>
      jsonResponse({
        workflow_runs: url.includes('tag-stable.yml') ? loadRawFixture<RawRuns>('github-runs') : [],
      }),
    )
    const result = await fetchStablePromotions(deps)
    expect(result.status).toBe('ok')
    expect(
      urls.some((url) => url.includes('/actions/workflows/tag-stable.yml/runs?status=success')),
    ).toBe(true)
  })

  test('fetchStablePromotions merges automated promotions read from suggest-stable jobs', async () => {
    const {deps, urls} = depsFor((url) => {
      if (url.includes('tag-stable.yml')) {
        return jsonResponse({
          workflow_runs: [
            {
              display_title: 'Tag @stable - 6.15.0',
              created_at: '2026-09-29T17:02:35Z',
              conclusion: 'success',
            },
          ],
        })
      }
      if (url.includes('suggest-stable.yml/runs?status=cancelled')) {
        return jsonResponse({workflow_runs: [{id: 501}]})
      }
      if (url.includes('suggest-stable.yml')) {
        return jsonResponse({workflow_runs: [{id: 502}]})
      }
      if (url.includes('/runs/501/jobs')) {
        return jsonResponse({
          jobs: [
            {
              name: 'Tag 6.23.0 as stable / Determine version',
              conclusion: 'success',
              completed_at: '2026-11-25T10:00:00Z',
            },
            {
              name: 'Tag 6.23.0 as stable / Update NPM dist-tags',
              conclusion: 'success',
              completed_at: '2026-11-25T10:05:00Z',
            },
            {
              name: 'Tag 6.23.0 as stable / Update bundle manifest',
              conclusion: 'success',
              completed_at: '2026-11-25T10:07:30Z',
            },
            {name: 'Report slot 1', conclusion: 'success', completed_at: '2026-11-25T10:08:00Z'},
          ],
        })
      }
      return jsonResponse({
        jobs: [
          {
            name: 'Tag 6.22.0 as stable / Update NPM dist-tags',
            conclusion: 'success',
            completed_at: '2026-11-26T10:05:00Z',
          },
          {
            name: 'Tag 6.22.0 as stable / Update bundle manifest',
            conclusion: 'failure',
            completed_at: '2026-11-26T10:07:00Z',
          },
        ],
      })
    })
    const result = await fetchStablePromotions(deps)
    expect(result).toEqual({
      status: 'ok',
      data: [
        {version: '6.15.0', at: '2026-09-29T17:02:35Z'},
        {version: '6.23.0', at: '2026-11-25T10:07:30Z'},
      ],
    })
    expect(urls.some((url) => url.includes('/runs/501/jobs'))).toBe(true)
  })

  test('a workflow that does not exist yet means no automated promotions', async () => {
    const {deps} = depsFor((url) =>
      url.includes('suggest-stable.yml')
        ? new Response('not found', {status: 404})
        : jsonResponse({workflow_runs: loadRawFixture<RawRuns>('github-runs')}),
    )
    expect((await fetchStablePromotions(deps)).status).toBe('ok')
  })

  test('normaliseAutomatedPromotions needs both tagging jobs to succeed', () => {
    expect(
      normaliseAutomatedPromotions([
        {
          name: 'Tag 6.23.0 as stable / Update NPM dist-tags',
          conclusion: 'success',
          completed_at: '2026-11-25T10:05:00Z',
        },
      ]),
    ).toEqual([])
  })

  test('fetchStablePromotions reports unavailable on an API error', async () => {
    const {deps} = depsFor(() => new Response('forbidden', {status: 403}))
    expect(await fetchStablePromotions(deps)).toEqual({
      status: 'unavailable',
      error: expect.stringContaining('403'),
    })
  })

  test('fetchIssues searches per month with the bearer token and merges the results', async () => {
    const issues = loadRawFixture<RawIssues>('github-issues')
    const {deps, urls} = depsFor((url) => {
      const query = decodeURIComponent(url)
      return jsonResponse(
        query.includes('2026-11-01')
          ? {total_count: issues.length, items: issues}
          : {total_count: 0, items: []},
      )
    })
    const result = await fetchIssues(deps, {
      from: new Date('2026-10-20T00:00:00Z'),
      to: new Date('2026-11-20T00:00:00Z'),
      knownVersions: ['6.23.0', '6.24.0-next.1'],
    })
    expect(urls).toHaveLength(2)
    expect(urls.every((url) => url.startsWith('https://api.github.com/search/issues?q='))).toBe(
      true,
    )
    expect(decodeURIComponent(urls[0] ?? '')).toContain(
      'repo:sanity-io/sanity is:issue created:2026-10-20T00:00:00Z..',
    )
    expect(result.status === 'ok' && result.data.map((issue) => issue.number)).toEqual([
      15612, 15773, 15874, 16063, 16212,
    ])
    expect(
      result.status === 'ok' &&
        result.data.find((issue) => issue.number === 16063)?.versionsMentioned,
    ).toEqual(['6.23.0'])
  })

  test('fetchIssues splits a window that exceeds the search cap', async () => {
    const {deps, urls} = depsFor((url) => {
      const query = decodeURIComponent(url)
      const isFullMonth = query.includes('2026-11-01T00:00:00Z..2026-11-30T23:59:59Z')
      return jsonResponse({total_count: isFullMonth ? 1500 : 3, items: []})
    })
    await fetchIssues(deps, {
      from: new Date('2026-11-01T00:00:00Z'),
      to: new Date('2026-11-30T23:59:59Z'),
      knownVersions: [],
    })
    expect(urls.length).toBeGreaterThan(1)
  })

  test('fetchIssues reports unavailable on failure', async () => {
    const {deps} = depsFor(() => new Response('nope', {status: 500}))
    const result = await fetchIssues(deps, {
      from: new Date('2026-11-01T00:00:00Z'),
      to: new Date('2026-11-02T00:00:00Z'),
      knownVersions: [],
    })
    expect(result.status).toBe('unavailable')
  })

  test('fetchApprovals reads the run approvals and throws on failure', async () => {
    const {deps, urls} = depsFor(() =>
      jsonResponse([
        {
          state: 'approved',
          comment: 'ok',
          user: {login: 'someone'},
          environments: [{name: 'stable-candidate-1'}],
        },
      ]),
    )
    expect(await fetchApprovals(deps, 123)).toEqual([
      {login: 'someone', comment: 'ok', state: 'approved', slots: [1]},
    ])
    expect(urls[0]).toBe('https://api.github.com/repos/sanity-io/sanity/actions/runs/123/approvals')
    const failing = depsFor(() => new Response('no', {status: 403})).deps
    await expect(fetchApprovals(failing, 1)).rejects.toThrow(/403/)
  })
})

describe('normaliseLatestMoves', () => {
  test('keeps successful Tag @latest runs, oldest first', () => {
    expect(
      normaliseLatestMoves([
        {
          display_title: 'Tag @latest - 5.31.1',
          created_at: '2026-06-10T18:24:24Z',
          conclusion: 'success',
        },
        {
          display_title: 'Tag @latest - 5.30.0',
          created_at: '2026-06-03T10:00:00Z',
          conclusion: 'success',
        },
        {
          display_title: 'Tag @latest - 5.29.0',
          created_at: '2026-06-01T10:00:00Z',
          conclusion: 'failure',
        },
        {
          display_title: 'Tag @stable - 5.28.0',
          created_at: '2026-05-01T10:00:00Z',
          conclusion: 'success',
        },
        {
          display_title: 'Tag @latest - ',
          created_at: '2026-05-02T10:00:00Z',
          conclusion: 'success',
        },
      ]),
    ).toEqual([
      {version: '5.30.0', at: '2026-06-03T10:00:00Z'},
      {version: '5.31.1', at: '2026-06-10T18:24:24Z'},
    ])
  })
})
