import {Subject} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  observePresenceSessions,
  parsePresenceActor,
  presenceIdentity,
  smoothAgentPresence,
} from './agentPresence'
import {type TransportEvent} from './message-transports/transport'
import {type Session} from './types'

const session = (sessionId: string, path: string[] = ['description'], agent = true): Session => ({
  sessionId,
  userId: 'user',
  lastActiveAt: new Date().toISOString(),
  locations: [
    {type: 'document', documentId: 'drafts.product', path, lastActiveAt: new Date().toISOString()},
  ],
  ...(agent ? {actor: {type: 'agent', id: 'logical-agent'}} : {}),
})
afterEach(() => vi.useRealTimers())

describe('agent presence identity', () => {
  it('preserves only bounded, recognized actor metadata', () => {
    expect(parsePresenceActor({type: 'agent', id: 'logical-agent', token: 'secret'})).toEqual({
      type: 'agent',
      id: 'logical-agent',
    })
    expect(parsePresenceActor({type: 'human', id: 'logical-agent'})).toBeUndefined()
    expect(parsePresenceActor({type: 'agent', id: 'x'.repeat(129)})).toEqual({type: 'agent'})
  })
  it('groups agents across operations without collapsing people, other agents or users', () => {
    const key = (id: string, user = 'user') =>
      presenceIdentity({user: {id: user}, actor: {type: 'agent', id}, sessionId: 'operation'})
    expect(key('one')).not.toEqual(presenceIdentity({user: {id: 'user'}}))
    expect(key('one')).not.toEqual(key('two'))
    expect(key('one')).not.toEqual(key('one', 'other'))
  })
})

describe('wire session tracking', () => {
  it('expires silent agents, keeps people, and isolates departures by authenticated user', () => {
    vi.useFakeTimers()
    const events = new Subject<TransportEvent>()
    let latest: Session[] = []
    const sub = events.pipe(observePresenceSessions()).subscribe((value) => {
      latest = value
    })
    for (const [userId, agent] of [
      ['one', true],
      ['two', false],
    ] as const) {
      const s = session('same-wire-id', [], agent)
      events.next({
        type: 'state',
        userId,
        sessionId: s.sessionId,
        locations: s.locations,
        actor: s.actor,
        timestamp: s.lastActiveAt,
      })
    }
    expect(latest).toHaveLength(2)
    events.next({type: 'disconnect', userId: 'other', sessionId: 'same-wire-id', timestamp: ''})
    expect(latest).toHaveLength(2)
    vi.advanceTimersByTime(90_000)
    expect(latest.map((s) => s.userId)).toEqual(['two'])
    sub.unsubscribe()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('display-only agent smoothing', () => {
  it('retains quick patches for two seconds and cancels removal on another instance update', () => {
    vi.useFakeTimers()
    const source = new Subject<Session[]>()
    let latest: Session[] = []
    const sub = source.pipe(smoothAgentPresence()).subscribe((value) => {
      latest = value
    })
    source.next([session('instance-one')])
    source.next([])
    expect(latest).toHaveLength(1)
    vi.advanceTimersByTime(1_000)
    source.next([session('instance-two')])
    vi.advanceTimersByTime(2_000)
    expect(latest).toHaveLength(1)
    source.next([])
    vi.advanceTimersByTime(1_999)
    expect(latest).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(latest).toEqual([])
    sub.unsubscribe()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('keeps concurrent operations visible and smooths field departures independently', () => {
    vi.useFakeTimers()
    const source = new Subject<Session[]>()
    let latest: Session[] = []
    const sub = source.pipe(smoothAgentPresence()).subscribe((value) => {
      latest = value
    })
    source.next([session('one'), session('two'), session('person', ['title'], false)])
    expect(latest).toHaveLength(2)
    source.next([session('two')])
    vi.advanceTimersByTime(2_001)
    expect(latest).toHaveLength(1)
    expect(latest[0].locations).toHaveLength(1)
    source.next([session('three', ['title'])])
    expect(latest[0].locations.map((l) => l.path)).toEqual([['description'], ['title']])
    vi.advanceTimersByTime(2_000)
    expect(latest[0].locations.map((l) => l.path)).toEqual([['title']])
    source.next([])
    sub.unsubscribe()
    expect(vi.getTimerCount()).toBe(0)
  })
})
