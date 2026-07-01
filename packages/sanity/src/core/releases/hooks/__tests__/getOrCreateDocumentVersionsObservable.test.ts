import {type ReleaseDocument} from '@sanity/client'
import {BehaviorSubject, firstValueFrom, of, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../preview'
import {
  type DocumentPerspectiveState,
  getOrCreateDocumentVersionsObservable,
  getOrCreateDocumentVersionsWithSystemObservable,
  observableCache,
  withSystemCache,
} from '../useDocumentVersions'

describe('getOrCreateDocumentVersionsObservable', () => {
  it('emits loading: true while document stub fields are being resolved', async () => {
    observableCache.clear()

    const documentPreviewStore = {
      unstable_observeVersionDocumentIds: vi
        .fn<DocumentPreviewStore['unstable_observeVersionDocumentIds']>()
        .mockReturnValue(of(['drafts.article-1'])),
      observePaths: vi.fn<DocumentPreviewStore['observePaths']>().mockReturnValue(
        of({
          _id: 'drafts.article-1',
          _rev: 'rev-1',
          _createdAt: '2024-01-01T00:00:00.000Z',
          _updatedAt: '2024-01-02T00:00:00.000Z',
          _system: {
            bundleId: 'drafts',
            group: {_ref: 'article-1', _weak: true},
          },
        }),
      ),
    } as unknown as DocumentPreviewStore

    const emissions = await firstValueFrom(
      getOrCreateDocumentVersionsObservable({
        documentPreviewStore,
        publishedId: 'article-1',
        projectId: 'test-project',
        dataset: 'test',
      }).pipe(toArray()),
    )

    expect(documentPreviewStore.observePaths).toHaveBeenCalledWith({_id: 'drafts.article-1'}, [
      '_id',
      '_type',
      '_rev',
      '_createdAt',
      '_updatedAt',
      '_system',
    ])

    expect(emissions).toEqual([
      {
        data: ['drafts.article-1'],
        versions: [],
        error: null,
        loading: true,
      },
      {
        data: ['drafts.article-1'],
        versions: [
          {
            _id: 'drafts.article-1',
            _rev: 'rev-1',
            _createdAt: '2024-01-01T00:00:00.000Z',
            _updatedAt: '2024-01-02T00:00:00.000Z',
            _system: {
              bundleId: 'drafts',
              group: {_ref: 'article-1', _weak: true},
            },
          },
        ],
        error: null,
        loading: false,
      },
    ])
  })
})

/**
 * Builds a `documentPreviewStore` whose version documents carry no `_system`,
 * so the with-system factory always runs the `temporarilyBuildDocumentSystem`
 * stitch. `observePathsSpy` counts how often the leaf observable is created,
 * which stays flat across additional subscribers because the base observable is
 * shared.
 */
function createSystemlessPreviewStore(versionIds: string[]) {
  const observePathsSpy = vi
    .fn<DocumentPreviewStore['observePaths']>()
    .mockImplementation((value: {_id: string}) =>
      of({_id: value._id, _rev: '', _createdAt: '', _updatedAt: ''}),
    )

  const documentPreviewStore = {
    unstable_observeVersionDocumentIds: vi
      .fn<DocumentPreviewStore['unstable_observeVersionDocumentIds']>()
      .mockReturnValue(of(versionIds)),
    observePaths: observePathsSpy,
  } as unknown as DocumentPreviewStore

  return {documentPreviewStore, observePathsSpy}
}

const asapReleaseDocument = {
  _id: '_.releases.rASAP',
  name: 'rASAP',
} as unknown as ReleaseDocument

describe('getOrCreateDocumentVersionsWithSystemObservable', () => {
  beforeEach(() => {
    observableCache.clear()
    withSystemCache.clear()
  })

  it('runs the derivation once for N subscribers', () => {
    const {documentPreviewStore, observePathsSpy} = createSystemlessPreviewStore([
      'versions.rASAP.document-1',
    ])
    const releases$ = new BehaviorSubject<ReleaseDocument[]>([asapReleaseDocument])

    const observable = getOrCreateDocumentVersionsWithSystemObservable({
      documentPreviewStore,
      publishedId: 'document-1',
      projectId: 'test-project',
      dataset: 'test',
      releases$,
    })

    const subscriberCount = 5
    const subscriptions = Array.from({length: subscriberCount}, () => observable.subscribe())

    // The base observable's leaf `observePaths` is created once for the single
    // version id, regardless of how many subscribers attach to the shared chain.
    expect(observePathsSpy).toHaveBeenCalledTimes(1)
    // The stitch layer (withSystemCache) also builds exactly one entry for N subscribers.
    expect(withSystemCache.size).toBe(1)

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('pushing a new releases$ array updates all subscribers', () => {
    const {documentPreviewStore} = createSystemlessPreviewStore(['versions.rASAP.document-1'])
    // Start with no releases so the stitched `_system.release` is undefined.
    const releases$ = new BehaviorSubject<ReleaseDocument[]>([])

    const observable = getOrCreateDocumentVersionsWithSystemObservable({
      documentPreviewStore,
      publishedId: 'document-1',
      projectId: 'test-project',
      dataset: 'test',
      releases$,
    })

    const subscriberCount = 2
    const latestBySubscriber: Array<DocumentPerspectiveState> = []
    const subscriptions = Array.from({length: subscriberCount}, (_unused, index) =>
      observable.subscribe((state) => {
        latestBySubscriber[index] = state
      }),
    )

    // Before the new releases arrive, no release is matched.
    latestBySubscriber.forEach((state) => {
      expect(state.versions[0]._system.release).toBeUndefined()
    })

    // Pushing a new releases array flows through combineLatest (dataflow), not a
    // stale closure, so every subscriber sees the newly matched release.
    releases$.next([asapReleaseDocument])

    latestBySubscriber.forEach((state) => {
      expect(state.versions[0]._system.release).toEqual({_ref: '_.releases.rASAP', _weak: true})
    })

    subscriptions.forEach((subscription) => subscription.unsubscribe())
  })

  it('evicts the cache to size 0 after the last unsubscribe', () => {
    const {documentPreviewStore} = createSystemlessPreviewStore(['versions.rASAP.document-1'])
    const releases$ = new BehaviorSubject<ReleaseDocument[]>([asapReleaseDocument])

    const observable = getOrCreateDocumentVersionsWithSystemObservable({
      documentPreviewStore,
      publishedId: 'document-1',
      projectId: 'test-project',
      dataset: 'test',
      releases$,
    })

    const firstSubscription = observable.subscribe()
    const secondSubscription = observable.subscribe()

    expect(withSystemCache.size).toBe(1)

    firstSubscription.unsubscribe()
    secondSubscription.unsubscribe()

    // finalize (which runs before shareReplay) deletes the cache key once the
    // refCount drops to zero, so there is no leak.
    expect(withSystemCache.size).toBe(0)
  })
})
