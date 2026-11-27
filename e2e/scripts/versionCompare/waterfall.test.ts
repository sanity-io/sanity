import {describe, expect, test} from 'vitest'

import {type RequestEntry} from './network'
import {buildWaterfall, serialChain, splitChain, taskStartLookup} from './waterfall'

const ORIGIN = 'http://localhost:3339'

function request(
  id: string,
  url: string,
  times: {start: number; end: number | null},
  overrides: Partial<RequestEntry> = {},
): RequestEntry {
  return {
    category: 'js',
    decodedBytes: 300,
    endMs: times.end,
    failed: null,
    id,
    initiator: {fromCode: false, requestId: null, type: 'script', url: null},
    method: 'GET',
    protocol: 'http/1.1',
    queuedMs: 0,
    resourceType: 'Script',
    responseMs: times.end,
    startMs: times.start,
    status: 200,
    transferBytes: 100,
    url,
    waitMs: 10,
    ...overrides,
  }
}

const documentRequest = request(
  'doc',
  `${ORIGIN}/404`,
  {end: 50, start: 0},
  {
    category: 'document',
    initiator: {fromCode: false, requestId: null, type: 'other', url: null},
    resourceType: 'Document',
  },
)
const entry = request(
  'entry',
  `${ORIGIN}/static/sanity.js`,
  {end: 300, start: 60},
  {initiator: {fromCode: false, requestId: null, type: 'parser', url: `${ORIGIN}/404`}},
)
const chunk = request(
  'chunk',
  `${ORIGIN}/static/chunk.js`,
  {end: 500, start: 310},
  {
    initiator: {
      fromCode: false,
      requestId: null,
      type: 'script',
      url: `${ORIGIN}/static/sanity.js`,
    },
  },
)
// Issued by code in the entry, but only once the chunk had loaded and a task ran it.
const usersMe = request(
  'users',
  'https://p.api.sanity.work/v1/users/me',
  {end: 900, start: 700},
  {
    category: 'api',
    initiator: {fromCode: true, requestId: null, type: 'script', url: `${ORIGIN}/static/sanity.js`},
    resourceType: 'Fetch',
  },
)
const preflight = request(
  'users.preflight',
  'https://p.api.sanity.work/v1/users/me',
  {end: 750, start: 700},
  {
    category: 'preflight',
    initiator: {
      fromCode: false,
      requestId: 'users',
      type: 'preflight',
      url: 'https://p.api.sanity.work/v1/users/me',
    },
    method: 'OPTIONS',
    resourceType: 'Other',
  },
)
// Still loading at ready, and a font, neither of which can end the chain.
const listener = request(
  'listen',
  'https://p.api.sanity.work/v1/data/listen',
  {end: null, start: 950},
  {category: 'api', resourceType: 'Fetch'},
)
const font = request(
  'font',
  'https://fonts.example/inter.woff2',
  {end: 990, start: 100},
  {category: 'font', resourceType: 'Font'},
)
const requests = [documentRequest, entry, font, chunk, usersMe, preflight, listener]

describe('serialChain', () => {
  test('follows referencing files, preflights and the responses that let code run', () => {
    // The task that issued `/users/me` started at 650, after the chunk's response at 500.
    const taskStart = taskStartLookup([
      [650, 720],
      [905, 1000],
    ])
    const chain = serialChain(requests, 1000, taskStart)
    expect(chain.map((link) => link.id)).toEqual([
      'doc',
      'entry',
      'chunk',
      'users.preflight',
      'users',
    ])
  })

  test('ignores responses that arrived after the task that reached ready had started', () => {
    // Ready was set at 1000 in a task that started at 880, before `/users/me` finished.
    const chain = serialChain(requests, 1000, taskStartLookup([[880, 1000]]))
    expect(chain.at(-1)?.id).toBe('chunk')
  })

  test('falls back to the latest response when the initiator names nothing that loaded', () => {
    const orphan = request(
      'orphan',
      `${ORIGIN}/static/orphan.js`,
      {end: 600, start: 520},
      {initiator: {fromCode: false, requestId: null, type: 'script', url: 'about:client'}},
    )
    const chain = serialChain([documentRequest, entry, chunk, orphan], 610)
    expect(chain.map((link) => link.id)).toEqual(['doc', 'entry', 'chunk', 'orphan'])
  })
})

describe('splitChain', () => {
  test('splits the chain into network time, gaps between requests and the tail to ready', () => {
    const chain = [documentRequest, entry, chunk, preflight, usersMe]
    expect(splitChain(chain, 1000)).toEqual({gapMs: 220, networkMs: 680, tailMs: 100})
  })
})

describe('buildWaterfall', () => {
  test('counts requests and bytes before ready per category', () => {
    const waterfall = buildWaterfall({
      files: {network: 'n.json', trace: 't.json'},
      mainThread: null,
      path: '/404',
      readyMs: 1000,
      requests,
      tasks: [],
    })
    expect(waterfall.requests).toBe(7)
    expect(waterfall.transferBytes).toBe(700)
    expect(waterfall.byCategory.js).toEqual({count: 2, decodedBytes: 600, transferBytes: 200})
    expect(waterfall.byCategory.preflight?.count).toBe(1)
    expect(waterfall.notable.map((link) => link.id)).toEqual([
      'doc',
      'font',
      'users',
      'users.preflight',
      'listen',
    ])
  })
})
