import {firstValueFrom, of, toArray} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {collectEmissions} from './__fixtures__/collect.fixture'
import {publishDocumentVersionEvent} from './__fixtures__/events.fixture'
import {createMockClient} from './__fixtures__/mockClient'
import {createEventsStore} from './createEventsStore'

describe('createEventsStore', () => {
  it('returns an idle empty store without fetching when documentId is missing', async () => {
    const {client, requests} = createMockClient()
    const store = createEventsStore({
      client,
      documentId: undefined,
      documentType: 'author',
      isLiveEdit: false,
    })

    const {values, subscription} = collectEmissions(store.eventsObservable$)
    expect(values).toEqual([{events: [], nextCursor: '', loading: false, error: null}])
    subscription.unsubscribe()

    const diffs = await firstValueFrom(store.getDocumentChanges(of(null), of(null)).pipe(toArray()))
    expect(diffs).toEqual([{diff: null, loading: false, error: null}])

    store.loadMoreEvents()
    store.reloadEvents()
    await store.handleExpandEvent(publishDocumentVersionEvent())
    const listener = store.remoteTransactionsListener()
    listener.unsubscribe()

    expect(requests).toHaveLength(0)
  })
})
