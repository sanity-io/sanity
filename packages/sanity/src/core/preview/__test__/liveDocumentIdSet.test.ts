import {createClient, type ListenEvent} from '@sanity/client'
import {defer, delay, type Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, onTestFinished, vi} from 'vitest'

import {it} from '../../../../test/testUtils/listenerOutagesTest'
import {createDocumentIdSetObserver, type DocumentIdSetObserverState} from '../liveDocumentIdSet'

type Event = ListenEvent<Record<string, unknown>>

/**
 * A client whose listener connections can each be driven separately, and whose fetch answers with
 * the ids it is given, in order, one per fetch.
 */
function setup(projectId: string, fetchResults: (string[] | Observable<string[]>)[]) {
  const client = createClient({
    projectId,
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockImplementation(() => client)

  const connections: Subject<Event>[] = []
  vi.spyOn(client.observable, 'listen').mockImplementation(
    () =>
      defer(() => {
        const connection = new Subject<Event>()
        connections.push(connection)
        return connection
      }) as never,
  )
  const fetch = vi.spyOn(client.observable, 'fetch').mockImplementation((() => {
    const next = fetchResults.shift() ?? []
    return Array.isArray(next) ? of(next) : next
  }) as never)

  const states: DocumentIdSetObserverState[] = []
  const subscription = createDocumentIdSetObserver(client)('_type == "book"').subscribe((state) =>
    states.push(state),
  )
  onTestFinished(() => subscription.unsubscribe())
  return {connections, current: () => connections[connections.length - 1], fetch, states}
}

const welcome = {type: 'welcome', listenerName: 'test'} as Event
const reconnect = {type: 'reconnect'} as Event

function mutation(documentId: string, transition: 'appear' | 'disappear'): Event {
  return {type: 'mutation', documentId, transition} as Event
}

describe('createDocumentIdSetObserver while its listener is down', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches the set, and fetches it again once the listener connects', ({projectId}) => {
    const {current, fetch, states} = setup(projectId, [['book-1'], ['book-1', 'book-2']])

    current().next(reconnect)
    expect(states).toEqual([{status: 'reconnecting', documentIds: ['book-1']}])

    current().next(welcome)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-1', 'book-2']})
  })

  it('keeps the set without fetching again when a live listener goes down', ({projectId}) => {
    const {current, fetch, states} = setup(projectId, [['book-1']])

    current().next(welcome)
    current().next(reconnect)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(states).toEqual([
      {status: 'connected', documentIds: ['book-1']},
      {status: 'reconnecting', documentIds: ['book-1']},
    ])
  })

  it('never lets a slow fetch made while the listener was down replace a live one', async ({
    projectId,
  }) => {
    const {current, states} = setup(projectId, [of(['stale']).pipe(delay(100)), ['book-1']])

    current().next(reconnect)
    current().next(welcome)
    await vi.advanceTimersByTimeAsync(100)

    expect(states).toEqual([{status: 'connected', documentIds: ['book-1']}])
  })

  it('applies mutations once the listener connects', ({projectId}) => {
    const {current, states} = setup(projectId, [['book-1'], ['book-1']])

    current().next(reconnect)
    current().next(welcome)
    current().next(mutation('book-2', 'appear'))
    current().next(mutation('book-1', 'disappear'))

    expect(states.at(-1)).toEqual({status: 'connected', documentIds: ['book-2']})
  })
})
