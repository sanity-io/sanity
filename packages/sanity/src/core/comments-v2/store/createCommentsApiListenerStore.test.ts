import {
  type CollaborationCommentDocument,
  createClient,
  type ListenEvent,
  type WelcomeEvent,
} from '@sanity/client'
import {Observable, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {LISTENER_RESET_DELAY} from '../../preview/constants'
import {
  type CommentsApiListenerEvent,
  createCommentsApiListenerStore,
  getCommentsResourcePrefix,
} from './createCommentsApiListenerStore'

const WELCOME: WelcomeEvent = {type: 'welcome', listenerName: 'test'}

/** A Comments API client on `dataset`, whose listener connections are served by `server` */
function setup(dataset: string) {
  const client = createClient({
    projectId: 'abc',
    dataset,
    apiVersion: 'vX',
    useCdn: false,
    collaboration: {organizationId: 'org'},
  })
  const server = new Subject<ListenEvent<CollaborationCommentDocument>>()
  const connections = {opened: 0, open: 0}
  const listen = vi.spyOn(client.collaboration.comments, 'listen').mockReturnValue(
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

  return {client, server, connections, listen}
}

describe('createCommentsApiListenerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the resource prefix off the reference format of the client', () => {
    expect(getCommentsResourcePrefix(setup('production').client)).toBe('dataset:abc.production:')
  })

  it("serves every subscriber from one connection on the comments of the client's resource", () => {
    const {client, server, connections, listen} = setup('production')
    const store = createCommentsApiListenerStore({client})
    const first: CommentsApiListenerEvent[] = []
    const second: CommentsApiListenerEvent[] = []

    const subscriptions = [
      store.events.subscribe((event) => first.push(event)),
      store.events.subscribe((event) => second.push(event)),
    ]

    expect(connections.opened).toBe(1)
    expect(listen).toHaveBeenCalledWith(
      '*[_type == "sanity.comment" && string::startsWith(target.document._ref, $resourcePrefix)]',
      {resourcePrefix: 'dataset:abc.production:'},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeResult: true,
        includeAllVersions: true,
        visibility: 'query',
        tag: 'comments-store',
      },
    )

    server.next({type: 'open'})
    server.next(WELCOME)
    expect(first).toEqual([WELCOME])
    expect(second).toEqual([WELCOME])

    const late: CommentsApiListenerEvent[] = []
    subscriptions.push(store.events.subscribe((event) => late.push(event)))
    expect(late).toEqual([WELCOME])
    expect(connections.opened).toBe(1)

    subscriptions.forEach((subscription) => subscription.unsubscribe())
    vi.advanceTimersByTime(LISTENER_RESET_DELAY)
    expect(connections.open).toBe(0)
  })

  it('opens one connection per resource', () => {
    const workspace = setup('production')
    const addonDataset = setup('production-comments')

    const subscriptions = [
      createCommentsApiListenerStore({client: workspace.client}).events.subscribe(),
      createCommentsApiListenerStore({client: addonDataset.client}).events.subscribe(),
    ]

    expect(workspace.connections.opened).toBe(1)
    expect(addonDataset.connections.opened).toBe(1)
    expect(addonDataset.listen).toHaveBeenCalledWith(
      expect.any(String),
      {resourcePrefix: 'dataset:abc.production-comments:'},
      expect.any(Object),
    )

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })
})
