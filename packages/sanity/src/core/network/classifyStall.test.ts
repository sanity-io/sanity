import {describe, expect, it} from 'vitest'

import {classifyStall, LISTENER_STALL_BUDGET} from './classifyStall'
import {type LedgerSnapshot} from './listenerLedger'

function snapshotWith(options: {selfCount?: number; othersTotal?: number}): LedgerSnapshot {
  const selfCount = options.selfCount ?? 0
  const othersTotal = options.othersTotal ?? 0
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

  it.each(['http/0.9', 'http/1.0', 'http/1.1'])(
    'reports unmeasured when this tab measured a legacy protocol (%s)',
    (protocol) => {
      const snapshot = snapshotWith({selfCount: 100, othersTotal: 50})
      expect(classifyStall({snapshot, protocol})).toBe('unmeasured')
    },
  )

  it('applies the H2 budget when the protocol has not measured yet', () => {
    const snapshot = snapshotWith({selfCount: 10, othersTotal: 10})
    expect(classifyStall({snapshot, protocol: undefined})).toBe('not-listener-limit')
  })

  it.each([undefined, 'unknown'])(
    'blames the tabs at the budget when the protocol probe gave no answer (%s)',
    (protocol) => {
      const snapshot = snapshotWith({selfCount: 10, othersTotal: LISTENER_STALL_BUDGET})
      expect(classifyStall({snapshot, protocol})).toBe('too-many-tabs')
    },
  )

  it('reports not-listener-limit just under the budget', () => {
    const snapshot = snapshotWith({selfCount: LISTENER_STALL_BUDGET - 1, othersTotal: 0})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('not-listener-limit')
  })

  it('a default, idle Studio (5-12 listeners) alone never reaches a specific kind', () => {
    const snapshot = snapshotWith({selfCount: 12, othersTotal: 0})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('not-listener-limit')
  })

  it('reports this-tab-over-limit at the budget with no other tab holding listeners', () => {
    const snapshot = snapshotWith({selfCount: LISTENER_STALL_BUDGET, othersTotal: 0})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('this-tab-over-limit')
  })

  it('reports this-tab-heavy at the budget next to a busy other tab', () => {
    const snapshot = snapshotWith({selfCount: LISTENER_STALL_BUDGET, othersTotal: 5})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('this-tab-heavy')
  })

  it('reports too-many-tabs when the total reaches the budget but this tab alone is under it', () => {
    const snapshot = snapshotWith({selfCount: 10, othersTotal: LISTENER_STALL_BUDGET})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('too-many-tabs')
  })

  it('never claims this-tab-over-limit or this-tab-heavy for a self count just under the budget', () => {
    const snapshot = snapshotWith({selfCount: LISTENER_STALL_BUDGET - 1, othersTotal: 5})
    expect(classifyStall({snapshot, protocol: 'h2'})).toBe('too-many-tabs')
  })
})
