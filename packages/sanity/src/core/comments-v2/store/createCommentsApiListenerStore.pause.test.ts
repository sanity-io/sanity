import {
  type CollaborationCommentDocument,
  createClient,
  type ListenEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {Observable, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../test/testUtils/documentVisibility'
import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {LISTENER_PAUSE_GRACE_PERIOD, listenerGate} from '../../store/listenerGate/listenerGate'
import {createCommentsApiListenerStore} from './createCommentsApiListenerStore'

let releaseListenerGate: (() => void) | undefined

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}

beforeEach(() => {
  vi.useFakeTimers()
  releaseListenerGate = listenerGate.enable()
})

afterEach(() => {
  vi.advanceTimersByTime(LISTENER_RESET_DELAY)
  releaseListenerGate?.()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('createCommentsApiListenerStore while the page is hidden', () => {
  it('disconnects, tells subscribers it is reconnecting, and connects again when shown', () => {
    const documentVisibility = stubDocumentVisibility()
    const client = createClient({
      projectId: 'abc',
      dataset: 'production',
      apiVersion: 'vX',
      useCdn: false,
      collaboration: {organizationId: 'org'},
    })
    const server = new Subject<ListenEvent<CollaborationCommentDocument>>()
    const connections = {opened: 0, open: 0}
    vi.spyOn(client.collaboration.comments, 'listen').mockReturnValue(
      new Observable<ListenEvent<CollaborationCommentDocument>>((subscriber) => {
        connections.opened += 1
        connections.open += 1
        const subscription = server.subscribe(subscriber)
        return () => {
          connections.open -= 1
          subscription.unsubscribe()
        }
      }),
    )
    const store = createCommentsApiListenerStore({client})
    const events: string[] = []
    const subscription = store.events.subscribe((event) => events.push(event.type))
    server.next(WELCOME)

    documentVisibility.set('hidden')
    vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
    expect(connections).toEqual({opened: 1, open: 0})
    expect(events).toEqual(['welcome', 'reconnect'])

    documentVisibility.set('visible')
    server.next(WELCOME)
    expect(connections).toEqual({opened: 2, open: 1})
    expect(events).toEqual(['welcome', 'reconnect', 'welcome'])
    subscription.unsubscribe()
  })
})
