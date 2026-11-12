import {type MutationEvent, type SanityClient} from '@sanity/client'
import {type DocumentSystem} from '@sanity/types'
import {catchError, firstValueFrom, Observable, of, Subject, take, throwError, toArray} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, type Mock, onTestFinished, vi} from 'vitest'

import {clearDocumentRevisionCache} from '../../../store/events/getDocumentAtRevision'
import {
  createReleaseMetadataAggregator,
  type MetadataWrapper,
} from '../createReleaseMetadataAggregator'

const UPDATED_AT = '2024-01-02T00:00:00Z'
const VARIANT_ID = 'versions.Tqa2GgX2epJOVp3Q.doc'
const OTHER_VARIANT_ID = 'versions.xYFwOySTjFN4i8uQ.other-doc'

const getPartOfReleaseIds = (query: string) =>
  Array.from(query.matchAll(/sanity::partOfRelease\("([^"]+)"\)/g), ([, releaseId]) => releaseId)

const getProjectedReleaseDocumentIds = (query: string) =>
  Array.from(
    query.matchAll(/"(_\.releases\.[^"]+)": \{/g),
    ([, releaseDocumentId]) => releaseDocumentId,
  )

const answerMetadataQuery = (query: string) =>
  of(
    Object.fromEntries(
      getProjectedReleaseDocumentIds(query).map((releaseDocumentId) => [
        releaseDocumentId,
        {updatedAt: UPDATED_AT, documentIds: ['doc']},
      ]),
    ),
  )

const mutationEvent = (
  documentId: string,
  event: Partial<Pick<MutationEvent, 'transition' | 'result' | 'previousRev'>> = {},
): MutationEvent => ({
  type: 'mutation',
  documentId,
  eventId: `tx#${documentId}`,
  identity: 'user',
  mutations: [],
  timestamp: UPDATED_AT,
  transactionId: 'tx',
  transition: 'update',
  visibility: 'query',
  transactionTotalEvents: 1,
  transactionCurrentEvent: 0,
  ...event,
})

const variantDocument = (documentId: string, system?: Partial<DocumentSystem>) => ({
  _id: documentId,
  _type: 'book',
  _rev: 'rev',
  _createdAt: UPDATED_AT,
  _updatedAt: UPDATED_AT,
  ...(system && {
    _system: {
      group: {_ref: 'doc', _weak: true},
      scopeId: documentId.split('.')[1],
      variants: [{_key: 'mobile', _ref: '_.variants.mobile'}],
      ...system,
    },
  }),
})

describe('createReleaseMetadataAggregator', () => {
  const mockClient = {
    config: () => ({projectId: 'project-id', dataset: 'dataset'}),
    observable: {
      fetch: vi.fn(),
      listen: vi.fn(),
      request: vi.fn(),
    },
  } as unknown as SanityClient & {
    observable: {
      fetch: Mock<(query: string) => Observable<Record<string, unknown>>>
      listen: Mock<SanityClient['observable']['listen']>
      request: Mock<(options: {url: string}) => Observable<{documents: unknown[]}>>
    }
  }

  const subscribe = (releaseDocumentIds: string[]) => {
    const values: MetadataWrapper[] = []
    const error = vi.fn()
    const subscription = createReleaseMetadataAggregator(mockClient)(releaseDocumentIds).subscribe({
      next: (value) => values.push(value),
      error,
    })
    onTestFinished(() => subscription.unsubscribe())
    return {values, error}
  }

  const getFetchedQuery = (call: number) => mockClient.observable.fetch.mock.calls[call][0]

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.observable.listen.mockReturnValue(new Subject())
  })

  it('should emit empty state when no release ids provided', async () => {
    const result = await firstValueFrom(createReleaseMetadataAggregator(mockClient)([]))
    expect(result).toEqual({data: null, error: null, loading: false})
  })

  it('should emit metadata for releases with loading states', async () => {
    mockClient.observable.fetch.mockReturnValue(
      of({
        ms: 0,
        result: {
          '_.releases.release-1': {
            updatedAt: '2024-01-01T00:00:00Z',
            documentCount: 1,
          },
        },
      }),
    )

    const values = await createReleaseMetadataAggregator(mockClient)(['_.releases.release-1'])
      .pipe(take(2), toArray())
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      .toPromise()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {
        loading: false,
        error: null,
        data: {
          ms: {documentCount: 0},
          result: {
            '_.releases.release-1': {
              updatedAt: '2024-01-01T00:00:00Z',
              documentCount: 1,
            },
            'documentCount': 0,
          },
        },
      },
    ])
  })

  it('should handle fetch errors with loading states', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Fetch failed')
    mockClient.observable.fetch.mockReturnValue(
      new Observable((subscriber) => subscriber.error(error)),
    )

    const values = await createReleaseMetadataAggregator(mockClient)(['_.releases.release-1'])
      .pipe(
        take(2),
        toArray(),
        catchError((err) =>
          of([
            {loading: true, data: null, error: null},
            {loading: false, data: null, error: err},
          ]),
        ),
      )
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      .toPromise()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {loading: false, data: null, error},
    ])
    expect(console.error).toHaveBeenCalledWith('Failed to fetch release metadata', error)
  })

  it('should handle null client', async () => {
    const result = await firstValueFrom(
      createReleaseMetadataAggregator(null)(['_.releases.release-1']),
    )
    expect(result).toEqual({data: null, error: null, loading: false})
  })

  it('should fetch metadata for multiple releases', async () => {
    mockClient.observable.fetch.mockReturnValue(
      of({
        ms: 0,
        result: {
          '_.releases.release-1': {updatedAt: '2024-01-01T00:00:00Z', documentCount: 1},
          '_.releases.release-2': {updatedAt: '2024-01-02T00:00:00Z', documentCount: 2},
        },
      }),
    )

    const values: any[] = []
    const subscription = createReleaseMetadataAggregator(mockClient)([
      '_.releases.release-1',
      '_.releases.release-2',
    ]).subscribe((value) => values.push(value))

    await new Promise((resolve) => setTimeout(resolve, 0))
    subscription.unsubscribe()

    expect(values).toEqual([
      {loading: true, data: null, error: null},
      {
        loading: false,
        error: null,
        data: {
          ms: {documentCount: 0},
          result: {
            '_.releases.release-1': {updatedAt: '2024-01-01T00:00:00Z', documentCount: 1},
            '_.releases.release-2': {updatedAt: '2024-01-02T00:00:00Z', documentCount: 2},
            'documentCount': 0,
          },
        },
      },
    ])
  })

  describe('when documents in the watched releases change', () => {
    let listener$: Subject<MutationEvent>

    beforeEach(() => {
      vi.useFakeTimers()
      clearDocumentRevisionCache()
      listener$ = new Subject()
      mockClient.observable.listen.mockReturnValue(listener$)
      mockClient.observable.fetch.mockImplementation(answerMetadataQuery)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('listens with the bare release ids that sanity::partOfRelease() takes', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF'])

      const [listenQuery] = mockClient.observable.listen.mock.calls[0]
      expect(getPartOfReleaseIds(listenQuery)).toEqual(['rABC', 'rDEF'])
      expect(getPartOfReleaseIds(getFetchedQuery(0))).toEqual(['rABC', 'rDEF'])
    })

    it('refetches only the release a version document belongs to, keyed by its release document id', () => {
      const {values, error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(mutationEvent('versions.rABC.doc'))
      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC'])
      expect(getProjectedReleaseDocumentIds(getFetchedQuery(1))).toEqual(['_.releases.rABC'])
      expect(values.at(-1)).toEqual({
        loading: false,
        error: null,
        data: {'_.releases.rABC': {updatedAt: UPDATED_AT, documentIds: ['doc'], documentCount: 1}},
      })
      expect(error).not.toHaveBeenCalled()
    })

    it.each(['update', 'appear'] as const)(
      'refetches only the release a variant document names in _system.release on %s',
      (transition) => {
        const {values, error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])

        listener$.next(
          mutationEvent(VARIANT_ID, {
            transition,
            result: variantDocument(VARIANT_ID, {
              bundleId: 'rDEF',
              release: {_ref: '_.releases.rDEF', _weak: true},
            }),
          }),
        )
        vi.advanceTimersByTime(1_000)

        expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
        expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rDEF'])
        expect(Object.keys(values.at(-1)?.data ?? {})).toEqual(['_.releases.rDEF'])
        expect(mockClient.observable.request).not.toHaveBeenCalled()
        expect(error).not.toHaveBeenCalled()
      },
    )

    it('falls back to _system.bundleId when a variant document has no release reference', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(
        mutationEvent(VARIANT_ID, {result: variantDocument(VARIANT_ID, {bundleId: 'rABC'})}),
      )
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
      expect(getProjectedReleaseDocumentIds(getFetchedQuery(1))).toEqual(['_.releases.rABC'])
    })

    it.each([
      [
        'an unwatched release',
        {bundleId: 'rXYZ', release: {_ref: '_.releases.rXYZ', _weak: true as const}},
      ],
      ['no release, like a variant of published', {}],
    ])('does not refetch when a variant document names %s', (_, system) => {
      const {error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(mutationEvent(VARIANT_ID, {result: variantDocument(VARIANT_ID, system)}))
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(1)
      expect(error).not.toHaveBeenCalled()
    })

    it('refetches every watched release when a changed document has no _system', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(mutationEvent(VARIANT_ID, {result: variantDocument(VARIANT_ID)}))
      vi.advanceTimersByTime(1_000)

      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC', 'rDEF'])
    })

    it('looks a deleted variant document up in history and refetches only the release it named', () => {
      const {error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])
      mockClient.observable.request.mockReturnValue(
        of({
          documents: [
            variantDocument(VARIANT_ID, {release: {_ref: '_.releases.rDEF', _weak: true}}),
          ],
        }),
      )

      listener$.next(
        mutationEvent(VARIANT_ID, {transition: 'disappear', previousRev: 'rev-before-delete'}),
      )
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
      expect(mockClient.observable.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `/data/history/dataset/documents/${VARIANT_ID}?revision=rev-before-delete`,
        }),
      )
      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
      expect(getProjectedReleaseDocumentIds(getFetchedQuery(1))).toEqual(['_.releases.rDEF'])
      expect(error).not.toHaveBeenCalled()
    })

    it('refetches every watched release when the history lookup fails', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      onTestFinished(() => consoleError.mockRestore())
      const {error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])
      mockClient.observable.request.mockReturnValue(
        throwError(() => new Error('History unavailable')),
      )

      listener$.next(mutationEvent(VARIANT_ID, {transition: 'disappear', previousRev: 'rev-1'}))
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
      expect(consoleError).toHaveBeenCalledWith(
        'Error fetching document at revision',
        expect.any(Error),
      )
      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC', 'rDEF'])
      expect(error).not.toHaveBeenCalled()
    })

    it('refetches every watched release when history has no document at the revision', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF'])
      mockClient.observable.request.mockReturnValue(of({documents: []}))

      listener$.next(mutationEvent(VARIANT_ID, {transition: 'disappear', previousRev: 'rev-1'}))
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC', 'rDEF'])
    })

    it('refetches every watched release when a deleted variant document has no previous revision', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(mutationEvent(VARIANT_ID, {transition: 'disappear'}))
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.request).not.toHaveBeenCalled()
      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC', 'rDEF'])
    })

    it('makes one refetch for the de-duplicated releases of a buffered batch', () => {
      subscribe(['_.releases.rABC', '_.releases.rDEF', '_.releases.rGHI'])
      mockClient.observable.request.mockReturnValue(
        of({
          documents: [
            variantDocument(OTHER_VARIANT_ID, {release: {_ref: '_.releases.rABC', _weak: true}}),
          ],
        }),
      )

      listener$.next(
        mutationEvent('versions.rABC.doc', {transition: 'disappear', previousRev: 'rev-1'}),
      )
      listener$.next(
        mutationEvent(VARIANT_ID, {
          result: variantDocument(VARIANT_ID, {release: {_ref: '_.releases.rDEF', _weak: true}}),
        }),
      )
      listener$.next(
        mutationEvent(OTHER_VARIANT_ID, {transition: 'disappear', previousRev: 'rev-2'}),
      )
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.request).toHaveBeenCalledTimes(1)
      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(2)
      expect(getProjectedReleaseDocumentIds(getFetchedQuery(1))).toEqual([
        '_.releases.rABC',
        '_.releases.rDEF',
      ])
    })

    it('keeps listening after refetching', () => {
      const {error} = subscribe(['_.releases.rABC', '_.releases.rDEF'])

      listener$.next(
        mutationEvent(VARIANT_ID, {
          result: variantDocument(VARIANT_ID, {release: {_ref: '_.releases.rABC', _weak: true}}),
        }),
      )
      vi.advanceTimersByTime(1_000)
      listener$.next(mutationEvent('versions.rDEF.doc'))
      vi.advanceTimersByTime(1_000)

      expect(mockClient.observable.fetch).toHaveBeenCalledTimes(3)
      expect(getPartOfReleaseIds(getFetchedQuery(1))).toEqual(['rABC'])
      expect(getPartOfReleaseIds(getFetchedQuery(2))).toEqual(['rDEF'])
      expect(error).not.toHaveBeenCalled()
      expect(listener$.observed).toBe(true)
    })
  })
})
