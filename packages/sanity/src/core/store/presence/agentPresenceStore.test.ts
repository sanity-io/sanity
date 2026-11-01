import {BehaviorSubject, of, Subject} from 'rxjs'
import {afterEach, expect, it, vi} from 'vitest'

import {type ConnectionStatusStore} from '../connection-status/connection-status-store'
import {type UserStore} from '../user/userStore'
import {createPresenceStore} from './presence-store'
import {type DocumentPresence} from './types'

afterEach(() => vi.useRealTimers())
it('carries Bifur actor metadata to document fields and aggregates concurrent server sessions', () => {
  vi.useFakeTimers()
  const frames = new Subject<unknown>()
  const request = vi.fn(() => of(undefined))
  const store = createPresenceStore({
    bifur: {listen: () => frames, request} as never,
    connectionStatusStore: {
      connectionStatus$: new BehaviorSubject({type: 'connected'}),
    } as unknown as ConnectionStatusStore,
    userStore: {getUsers: () => of([{id: 'user', displayName: 'Daniel'}])} as unknown as UserStore,
  })
  let latest: DocumentPresence[] = []
  const sub = store.documentPresence('product').subscribe((value) => {
    latest = value
  })
  const send = (sessionId: string) =>
    frames.next({
      type: 'state',
      i: 'user',
      m: {
        sessionId,
        actor: {type: 'agent', id: 'logical-agent'},
        locations: [
          {
            type: 'document',
            documentId: 'drafts.product',
            path: ['description'],
            lastActiveAt: new Date().toISOString(),
          },
        ],
      },
    })
  send('server-one')
  send('server-two')
  expect(latest).toHaveLength(1)
  expect(latest[0]).toMatchObject({
    actor: {type: 'agent', id: 'logical-agent'},
    path: ['description'],
    user: {displayName: 'Daniel'},
  })
  frames.next({type: 'disconnect', i: 'user', m: {session: 'server-one'}})
  vi.advanceTimersByTime(2_001)
  expect(latest).toHaveLength(1)
  frames.next({type: 'disconnect', i: 'user', m: {session: 'server-two'}})
  expect(latest).toHaveLength(1)
  vi.advanceTimersByTime(2_000)
  expect(latest).toEqual([])
  sub.unsubscribe()
  expect(vi.getTimerCount()).toBe(0)
})
