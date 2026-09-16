import {type BifurClient} from '@sanity/bifur-client'
import {type User} from '@sanity/types'
import {BehaviorSubject, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type ConnectionStatus} from '../connection-status/connection-status-store'
import {type UserStore} from '../user/userStore'
import {createPresenceStore, type PresenceStore, SESSION_ID} from './presence-store'
import {type DocumentPresence, type GlobalPresence, type PresenceLocation} from './types'

// Own location announcements are audited at this interval
const ANNOUNCE_DELAY = 200

const CONNECTED: ConnectionStatus = {type: 'connected', lastHeartbeat: new Date(0)}

type BifurRequest = {name: string; params: unknown}

interface Harness {
  store: PresenceStore
  /** Incoming presence events, in the shape the bifur transport receives them */
  incoming$: Subject<unknown>
  requests: BifurRequest[]
  connectionStatus$: BehaviorSubject<ConnectionStatus>
  getUsers: ReturnType<typeof vi.fn>
}

function createHarness(): Harness {
  const incoming$ = new Subject<unknown>()
  const requests: BifurRequest[] = []
  const bifur = {
    listen: vi.fn(() => incoming$),
    request: vi.fn((name: string, params: unknown) => {
      requests.push({name, params})
      return of(undefined)
    }),
  } as unknown as BifurClient

  const connectionStatus$ = new BehaviorSubject<ConnectionStatus>(CONNECTED)

  // Users are resolved by id; the "unknown" user cannot be fetched (e.g. insufficient privileges)
  const getUsers = vi.fn(async (ids: string[]): Promise<User[]> =>
    ids.filter((id) => id !== 'unknown').map((id) => ({id, displayName: `User ${id}`})),
  )

  const store = createPresenceStore({
    bifur,
    connectionStatusStore: {connectionStatus$},
    userStore: {getUsers} as unknown as UserStore,
  })

  return {store, incoming$, requests, connectionStatus$, getUsers}
}

function location(documentId: string, overrides: Partial<PresenceLocation> = {}): PresenceLocation {
  return {
    type: 'document',
    documentId,
    path: ['title'],
    lastActiveAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/** A state announcement from another client, as delivered by bifur */
function stateEvent(userId: string, sessionId: string, locations: PresenceLocation[]) {
  return {type: 'state', i: userId, m: {sessionId, locations}}
}

function disconnectEvent(userId: string, sessionId: string) {
  return {type: 'disconnect', i: userId, m: {session: sessionId}}
}

function rollCallEvent(userId: string, sessionId: string) {
  return {type: 'rollCall', i: userId, session: sessionId}
}

/** Subscribes and collects every emission */
function collect<T>(observable: {
  subscribe: (next: (value: T) => void) => {unsubscribe: () => void}
}) {
  const values: T[] = []
  const subscription = observable.subscribe((value) => values.push(value))
  return {values, subscription, latest: () => values[values.length - 1]}
}

// Let promises (user lookups) and pending timers settle
const settle = () => vi.advanceTimersByTimeAsync(0)

describe('presence-store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('documentPresence', () => {
    it('turns another session in the document into presence with path, session and selection', async () => {
      const {store, incoming$} = createHarness()
      const {values, latest, subscription} = collect<DocumentPresence[]>(
        store.documentPresence('doc-1'),
      )

      const selection = {
        anchor: {path: [{_key: 'a'}, 'children', {_key: 'b'}], offset: 3},
        focus: {path: [{_key: 'a'}, 'children', {_key: 'b'}], offset: 3},
        backward: false,
      }
      incoming$.next(
        stateEvent('alice', 'session-alice', [
          location('doc-1', {path: ['body', {_key: 'a'}, 'children', {_key: 'b'}], selection}),
        ]),
      )
      await settle()

      expect(values.length).toBeGreaterThan(0)
      expect(latest()).toEqual([
        {
          user: {id: 'alice', displayName: 'User alice'},
          documentId: 'doc-1',
          path: ['body', {_key: 'a'}, 'children', {_key: 'b'}],
          selection,
          sessionId: 'session-alice',
          lastActiveAt: expect.any(String),
        },
      ])
      subscription.unsubscribe()
    })

    it('emits nothing while no one else is in the document', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('alice', 'session-alice', [location('other-doc')]))
      await settle()

      expect(latest()).toEqual([])
      subscription.unsubscribe()
    })

    it('keeps one entry per location, so 10 users in the same field are 10 entries', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      for (let i = 0; i < 10; i++) {
        incoming$.next(stateEvent(`user-${i}`, `session-${i}`, [location('doc-1')]))
      }
      await settle()

      expect(latest()).toHaveLength(10)
      expect(new Set(latest().map((p) => p.user.id)).size).toBe(10)
      expect(latest().every((p) => p.path.join('.') === 'title')).toBe(true)
      subscription.unsubscribe()
    })

    it('keeps users in different fields apart by path', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      for (let i = 0; i < 10; i++) {
        incoming$.next(
          stateEvent(`user-${i}`, `session-${i}`, [location('doc-1', {path: [`field${i}`]})]),
        )
      }
      await settle()

      expect(latest().map((p) => p.path)).toEqual(Array.from({length: 10}, (_, i) => [`field${i}`]))
      subscription.unsubscribe()
    })

    it('removes the presence of a session that disconnects', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      incoming$.next(stateEvent('bob', 'session-bob', [location('doc-1')]))
      await settle()
      expect(latest()).toHaveLength(2)

      incoming$.next(disconnectEvent('alice', 'session-alice'))
      await settle()

      expect(latest().map((p) => p.user.id)).toEqual(['bob'])
      subscription.unsubscribe()
    })

    it('replaces the locations of a session that announces again', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1', {path: ['title']})]))
      await settle()
      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1', {path: ['body']})]))
      await settle()

      expect(latest()).toHaveLength(1)
      expect(latest()[0].path).toEqual(['body'])
      subscription.unsubscribe()
    })

    it('hides the current session from its own document presence', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('me', SESSION_ID, [location('doc-1')]))
      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()

      expect(latest().map((p) => p.sessionId)).toEqual(['session-alice'])
      subscription.unsubscribe()
    })

    it('drops sessions whose user profile cannot be fetched', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('unknown', 'session-unknown', [location('doc-1')]))
      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()

      expect(latest().map((p) => p.user.id)).toEqual(['alice'])
      subscription.unsubscribe()
    })

    it('includes drafts and versions of the document, unless versions are excluded', async () => {
      const {store, incoming$} = createHarness()
      const all = collect<DocumentPresence[]>(store.documentPresence('doc-1'))
      const excludingVersions = collect<DocumentPresence[]>(
        store.documentPresence('doc-1', {excludeVersions: true}),
      )

      incoming$.next(
        stateEvent('alice', 'session-alice', [
          location('doc-1'),
          location('drafts.doc-1'),
          location('versions.rSummer.doc-1'),
          location('doc-2'),
        ]),
      )
      await settle()

      expect(all.latest().map((p) => p.documentId)).toEqual([
        'doc-1',
        'drafts.doc-1',
        'versions.rSummer.doc-1',
      ])
      expect(excludingVersions.latest().map((p) => p.documentId)).toEqual(['doc-1'])

      all.subscription.unsubscribe()
      excludingVersions.subscription.unsubscribe()
    })

    it('does not re-emit when the presence of the document is unchanged', async () => {
      const {store, incoming$} = createHarness()
      const {values, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()
      const emissionsAfterFirst = values.length

      // Someone joins another document: the sessions change, this document's presence does not
      incoming$.next(stateEvent('bob', 'session-bob', [location('doc-2')]))
      await settle()

      expect(values.length).toBe(emissionsAfterFirst)
      subscription.unsubscribe()
    })
  })

  describe('globalPresence$', () => {
    it('groups the sessions of a user and lists all their locations', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<GlobalPresence[]>(store.globalPresence$)

      incoming$.next(stateEvent('alice', 'session-a', [location('doc-1')]))
      incoming$.next(stateEvent('alice', 'session-b', [location('doc-2', {path: ['body']})]))
      incoming$.next(stateEvent('bob', 'session-bob', [location('doc-1')]))
      await settle()

      expect(latest()).toHaveLength(2)
      const alice = latest().find((p) => p.user.id === 'alice')!
      expect(alice.status).toBe('online')
      expect(alice.locations.map((l) => [l.documentId, l.path])).toEqual([
        ['doc-1', ['title']],
        ['doc-2', ['body']],
      ])
      subscription.unsubscribe()
    })

    it('hides the current user from global presence', async () => {
      const {store, incoming$} = createHarness()
      const {latest, subscription} = collect<GlobalPresence[]>(store.globalPresence$)

      incoming$.next(stateEvent('me', SESSION_ID, [location('doc-1')]))
      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()

      expect(latest().map((p) => p.user.id)).toEqual(['alice'])
      subscription.unsubscribe()
    })
  })

  describe('announcing the own location', () => {
    it('requests a roll call and announces the current location once connected', async () => {
      const {store, requests} = createHarness()
      const {subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      await settle()
      expect(requests.map((r) => r.name)).toContain('presence_rollcall')

      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)
      expect(requests.at(-1)).toEqual({
        name: 'presence_announce',
        params: {data: {locations: [], sessionId: SESSION_ID}},
      })
      subscription.unsubscribe()
    })

    it('announces a new location set through setLocation', async () => {
      const {store, requests} = createHarness()
      const {subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)

      const locations = [location('doc-1', {path: ['title']})]
      store.setLocation(locations)
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)

      expect(requests.at(-1)).toEqual({
        name: 'presence_announce',
        params: {data: {locations, sessionId: SESSION_ID}},
      })
      subscription.unsubscribe()
    })

    it('re-announces when another client requests a roll call', async () => {
      const {store, requests, incoming$} = createHarness()
      const {subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)
      const announcementsBefore = requests.filter((r) => r.name === 'presence_announce').length

      incoming$.next(rollCallEvent('alice', 'session-alice'))
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)

      expect(requests.filter((r) => r.name === 'presence_announce').length).toBe(
        announcementsBefore + 1,
      )
      subscription.unsubscribe()
    })

    it('ignores its own roll call requests', async () => {
      const {store, requests, incoming$} = createHarness()
      const {subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)
      const announcementsBefore = requests.filter((r) => r.name === 'presence_announce').length

      incoming$.next(rollCallEvent('me', SESSION_ID))
      await vi.advanceTimersByTimeAsync(ANNOUNCE_DELAY)

      expect(requests.filter((r) => r.name === 'presence_announce').length).toBe(
        announcementsBefore,
      )
      subscription.unsubscribe()
    })
  })

  describe('connection status', () => {
    it('only listens to presence while connected', async () => {
      const {store, incoming$, connectionStatus$} = createHarness()
      connectionStatus$.next({type: 'connecting'})
      const {values, subscription} = collect<DocumentPresence[]>(store.documentPresence('doc-1'))

      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()
      expect(values).toEqual([])

      connectionStatus$.next(CONNECTED)
      incoming$.next(stateEvent('alice', 'session-alice', [location('doc-1')]))
      await settle()

      expect(values.at(-1)?.map((p) => p.user.id)).toEqual(['alice'])
      subscription.unsubscribe()
    })
  })
})
