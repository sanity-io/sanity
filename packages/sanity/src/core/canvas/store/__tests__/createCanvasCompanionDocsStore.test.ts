import {createClient, type ListenEvent, type MutationEvent, type WelcomeEvent} from '@sanity/client'
import {NEVER, type Observable, of, Subject} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createDocumentPreviewStore} from '../../../preview/documentPreviewStore'
import {type InvalidationChannelEvent} from '../../../preview/types'
import {type CompanionDoc} from '../../types'
import {type CompanionDocs, createCanvasCompanionDocsStore} from '../createCanvasCompanionDocsStore'

const LINK_FILTER = '_type == "sanity.canvas.link" && studioDocumentId in $ids'

function mutation(documentId: string): InvalidationChannelEvent {
  return {type: 'mutation', documentId, visibility: 'query'}
}

function setup(publishedId: string, initialVersionIds: string[]) {
  const client = createClient({
    projectId: 'abc',
    dataset: 'production',
    apiVersion: '2024-08-27',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig').mockReturnValue(client)

  let versionIds = initialVersionIds
  const companion: CompanionDoc = {
    _id: 'link-1',
    canvasDocumentId: 'canvas-1',
    studioDocumentId: publishedId,
    isStudioDocumentEditable: false,
  }
  function fakeFetch(_query: string, _params?: unknown, options?: {tag?: string}) {
    switch (options?.tag) {
      case 'preview.observe-version-ids':
        return of([versionIds])
      case 'preview.observe-document-set.fetch':
        return of([companion._id])
      case 'canvas.companion-docs':
        return of(companion)
      default:
        return NEVER
    }
  }
  const fetch = vi
    .spyOn(client.observable, 'fetch')
    .mockImplementation(fakeFetch as typeof client.observable.fetch)

  /** The listeners `client.observable.listen` opened, in order, with the events they deliver */
  const listeners: {query: string; params: unknown; events: Subject<ListenEvent<never>>}[] = []
  vi.spyOn(client.observable, 'listen').mockImplementation(
    (query: string, params?: unknown): Observable<ListenEvent<never>> => {
      const events = new Subject<ListenEvent<never>>()
      listeners.push({query, params, events})
      return events
    },
  )
  const globalListen = vi.spyOn(client, 'listen').mockReturnValue(NEVER)

  const invalidationChannel = new Subject<InvalidationChannelEvent>()
  const previewStore = createDocumentPreviewStore({
    client,
    globalListenerStore: {
      globalListener: new Subject<WelcomeEvent | MutationEvent>(),
      invalidationChannel,
    },
  })
  const store = createCanvasCompanionDocsStore({client, previewStore})

  return {
    store,
    fetch,
    listeners,
    globalListen,
    invalidationChannel,
    setVersionIds: (ids: string[]) => {
      versionIds = ids
    },
  }
}

function versionIdFetches(fetch: ReturnType<typeof setup>['fetch']) {
  return fetch.mock.calls.filter(([, , options]) => options?.tag === 'preview.observe-version-ids')
}

describe('createCanvasCompanionDocsStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('looks up the versions of a document on the global listener, and opens a listener for the links only', async () => {
    const {store, fetch, listeners, globalListen, invalidationChannel} = setup('doc-a', [
      'doc-a',
      'drafts.doc-a',
    ])
    const values: CompanionDocs[] = []
    const subscription = store.getCompanionDocs('drafts.doc-a').subscribe((value) => {
      values.push(value)
    })

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(100)

    expect(versionIdFetches(fetch)).toHaveLength(1)
    expect(listeners).toHaveLength(1)
    expect(listeners[0].query).toBe(`*[${LINK_FILTER}]`)
    expect(listeners[0].params).toEqual({ids: ['doc-a', 'drafts.doc-a']})

    listeners[0].events.next({type: 'welcome', listenerName: 'links'})
    await vi.advanceTimersByTimeAsync(0)

    expect(values.at(-1)).toEqual({
      data: [expect.objectContaining({_id: 'link-1', studioDocumentId: 'doc-a'})],
      error: null,
      loading: false,
    })
    expect(globalListen).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('looks for links on a new version once the global listener reports it, and not after an edit', async () => {
    const {store, fetch, listeners, invalidationChannel, setVersionIds} = setup('doc-b', [
      'doc-b',
      'drafts.doc-b',
    ])
    const subscription = store.getCompanionDocs('doc-b').subscribe()

    invalidationChannel.next({type: 'connected'})
    await vi.advanceTimersByTimeAsync(100)
    expect(listeners).toHaveLength(1)

    invalidationChannel.next(mutation('drafts.doc-b'))
    await vi.advanceTimersByTimeAsync(100)
    expect(versionIdFetches(fetch)).toHaveLength(2)
    expect(listeners).toHaveLength(1)

    invalidationChannel.next(mutation('other-doc'))
    await vi.advanceTimersByTimeAsync(1_000)
    expect(versionIdFetches(fetch)).toHaveLength(2)

    setVersionIds(['doc-b', 'drafts.doc-b', 'versions.rSummer.doc-b'])
    invalidationChannel.next(mutation('versions.rSummer.doc-b'))
    await vi.advanceTimersByTimeAsync(100)

    expect(listeners).toHaveLength(2)
    expect(listeners[1].query).toBe(`*[${LINK_FILTER}]`)
    expect(listeners[1].params).toEqual({
      ids: ['doc-b', 'drafts.doc-b', 'versions.rSummer.doc-b'],
    })
    subscription.unsubscribe()
  })
})
