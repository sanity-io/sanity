import {type SanityClient} from '@sanity/client'
import {of, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createDocumentSetObserver, type DocumentSetObserverState} from '../liveDocumentSet'

interface TestDoc {
  _id: string
  _rev?: string
}

function createMockClient(listen$: Subject<unknown>, fetchResult: unknown) {
  const fetch = vi.fn().mockReturnValue(of(fetchResult))
  const listen = vi.fn().mockReturnValue(listen$)
  const client = {
    withConfig: () => client,
    observable: {fetch, listen},
  } as unknown as SanityClient
  return {client, fetch, listen}
}

describe('createDocumentSetObserver', () => {
  it('fetches on welcome and applies appear/update/disappear incrementally without refetching', () => {
    const listen$ = new Subject<unknown>()
    const {client, fetch} = createMockClient(listen$, [{_id: 'a', _rev: '1'}])

    const emissions: DocumentSetObserverState<TestDoc>[] = []
    const subscription = createDocumentSetObserver(client)<TestDoc>('sanity::versionOf("a")', [
      '_id',
      '_rev',
    ]).subscribe((state) => emissions.push(state))

    // welcome -> single fetch of the whole set
    listen$.next({type: 'welcome'})

    // update -> reproject from the event result, no refetch (extra fields are dropped)
    listen$.next({
      type: 'mutation',
      transition: 'update',
      documentId: 'a',
      result: {_id: 'a', _rev: '2', _type: 'article', title: 'dropped'},
    })

    // appear -> add from the event result
    listen$.next({
      type: 'mutation',
      transition: 'appear',
      documentId: 'b',
      result: {_id: 'b', _rev: '1', _type: 'article'},
    })

    // disappear -> remove from the set
    listen$.next({type: 'mutation', transition: 'disappear', documentId: 'a'})

    subscription.unsubscribe()

    // The whole set is fetched exactly once (on welcome); every subsequent change is
    // applied incrementally from the listener events.
    expect(fetch).toHaveBeenCalledTimes(1)

    expect(emissions).toEqual([
      {status: 'connected', documents: [{_id: 'a', _rev: '1'}]},
      {status: 'connected', documents: [{_id: 'a', _rev: '2'}]},
      {
        status: 'connected',
        documents: [
          {_id: 'a', _rev: '2'},
          {_id: 'b', _rev: '1'},
        ],
      },
      {status: 'connected', documents: [{_id: 'b', _rev: '1'}]},
    ])
  })

  it('marks the set as reconnecting while retaining the current documents', () => {
    const listen$ = new Subject<unknown>()
    const {client} = createMockClient(listen$, [{_id: 'a', _rev: '1'}])

    const emissions: DocumentSetObserverState<TestDoc>[] = []
    const subscription = createDocumentSetObserver(client)<TestDoc>('sanity::versionOf("a")', [
      '_id',
      '_rev',
    ]).subscribe((state) => emissions.push(state))

    listen$.next({type: 'welcome'})
    listen$.next({type: 'reconnect'})

    subscription.unsubscribe()

    expect(emissions).toEqual([
      {status: 'connected', documents: [{_id: 'a', _rev: '1'}]},
      {status: 'reconnecting', documents: [{_id: 'a', _rev: '1'}]},
    ])
  })
})
