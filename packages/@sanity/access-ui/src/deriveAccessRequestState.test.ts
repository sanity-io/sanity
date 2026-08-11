import {describe, expect, it} from 'vitest'

import {deriveAccessRequestState} from './deriveAccessRequestState'
import {createAccessRequest} from './testUtils'
import {type AccessRequest, type AccessRequestState} from './types'

const NOW = new Date('2026-08-11T12:00:00Z').getTime()
const daysAgo = (days: number) => new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString()

const cases: {
  given: string
  requests: AccessRequest[] | null
  expected: AccessRequestState
}[] = [
  {given: 'no requests', requests: [], expected: 'none'},
  {given: 'a null response', requests: null, expected: 'none'},
  {
    given: 'requests for other resources only',
    requests: [createAccessRequest({resourceId: 'project-b', createdAt: daysAgo(1)})],
    expected: 'none',
  },
  {
    given: 'a pending request within two weeks',
    requests: [createAccessRequest({createdAt: daysAgo(13)})],
    expected: 'pending',
  },
  {
    given: 'a pending request older than two weeks',
    requests: [createAccessRequest({createdAt: daysAgo(15)})],
    expected: 'expired',
  },
  {
    given: 'a declined request within two weeks',
    requests: [createAccessRequest({status: 'declined', createdAt: daysAgo(1)})],
    expected: 'denied',
  },
  {
    given: 'a declined request older than two weeks',
    requests: [createAccessRequest({status: 'declined', createdAt: daysAgo(15)})],
    expected: 'none',
  },
  {
    given: 'a recent denial alongside a pending request',
    requests: [
      createAccessRequest({status: 'declined', createdAt: daysAgo(1)}),
      createAccessRequest({id: 'req-2', createdAt: daysAgo(1)}),
    ],
    expected: 'denied',
  },
  {
    given: 'accepted requests only',
    requests: [createAccessRequest({status: 'accepted', createdAt: daysAgo(1)})],
    expected: 'none',
  },
]

describe('deriveAccessRequestState', () => {
  it.each(cases)('$given → $expected', ({requests, expected}) => {
    expect(deriveAccessRequestState(requests, 'project-a', NOW)).toBe(expected)
  })
})
