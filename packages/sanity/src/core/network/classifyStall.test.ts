import {describe, expect, it} from 'vitest'

import {classifyStall, LISTENER_STALL_BUDGET, type StallKind} from './classifyStall'
import {type LedgerSnapshot} from './listenerLedger'

function snapshotWith(selfCount: number, othersTotal: number): LedgerSnapshot {
  return {
    self: {tabId: 'self', count: selfCount, isStalled: true},
    others: [],
    othersTotal,
    total: selfCount + othersTotal,
    liveTabCount: 1,
    unknownTabCount: 0,
    stalledOtherTabCount: 0,
  }
}

describe('classifyStall', () => {
  it('reports unmeasured when there is no Web Locks snapshot', () => {
    expect(classifyStall({snapshot: undefined, protocol: 'h2'})).toBe('unmeasured')
  })

  it.each<[string, number, number, string | undefined, StallKind]>([
    ['a legacy protocol', 100, 50, 'http/1.1', 'unmeasured'],
    ['a total just under the budget', LISTENER_STALL_BUDGET - 1, 0, 'h2', 'not-listener-limit'],
    ['this tab alone at the budget', LISTENER_STALL_BUDGET, 0, 'h2', 'this-tab-over-limit'],
    ['this tab at the budget next to a busy tab', LISTENER_STALL_BUDGET, 5, 'h2', 'this-tab-heavy'],
    ['other tabs filling the budget', LISTENER_STALL_BUDGET - 1, 5, 'h2', 'too-many-tabs'],
    ['an unmeasured protocol at the budget', 10, LISTENER_STALL_BUDGET, undefined, 'too-many-tabs'],
  ])('classifies %s', (_case, selfCount, othersTotal, protocol, kind) => {
    expect(classifyStall({snapshot: snapshotWith(selfCount, othersTotal), protocol})).toBe(kind)
  })
})
