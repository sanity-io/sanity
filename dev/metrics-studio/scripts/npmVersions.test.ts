import {expect, test} from 'vitest'

import {npmInfoForTags} from './npmVersions'

const DATA = {
  distTags: {
    'latest': '6.10.1',
    'stable': '6.7.0',
    'maintenance-v5': '5.31.2',
    'next': '6.11.0-next.49',
  },
  time: {
    'created': '2015-01-01T00:00:00Z',
    'modified': '2026-08-20T00:00:00Z',
    '6.10.1': '2026-08-18T22:00:00Z',
    '6.7.0': '2026-07-20T10:00:00Z',
    '6.0.0-rc.1': '2026-05-01T09:00:00Z',
  },
  downloads: {'6.10.1': 12345, '6.7.0': 65888},
}

test('maps vX.Y.Z tags to their npm version info', () => {
  const info = npmInfoForTags(['v6.10.1', 'v6.7.0'], DATA)
  expect(info.get('v6.10.1')).toEqual({
    publishedAt: '2026-08-18T22:00:00Z',
    distTags: ['latest'],
    weeklyDownloads: 12345,
  })
  expect(info.get('v6.7.0')).toEqual({
    publishedAt: '2026-07-20T10:00:00Z',
    distTags: ['stable'],
    weeklyDownloads: 65888,
  })
})

test('prerelease tags map through unchanged', () => {
  expect(npmInfoForTags(['v6.0.0-rc.1'], DATA).get('v6.0.0-rc.1')).toEqual({
    publishedAt: '2026-05-01T09:00:00Z',
  })
})

test('several dist-tags on one version are all kept, sorted', () => {
  const info = npmInfoForTags(['v6.7.0'], {
    distTags: {stable: '6.7.0', pinned: '6.7.0'},
  })
  expect(info.get('v6.7.0')).toEqual({distTags: ['pinned', 'stable']})
})

test('versions npm does not know resolve nothing', () => {
  const info = npmInfoForTags(['v9.9.9'], DATA)
  expect(info.has('v9.9.9')).toBe(false)
  expect(npmInfoForTags(['v6.10.1'], {}).size).toBe(0)
})

test('a zero download count is kept (zero is data, not absence)', () => {
  const info = npmInfoForTags(['v6.7.0'], {downloads: {'6.7.0': 0}})
  expect(info.get('v6.7.0')).toEqual({weeklyDownloads: 0})
})
