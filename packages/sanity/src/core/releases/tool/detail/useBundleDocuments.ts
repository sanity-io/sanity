import {type ReleaseDocument} from '@sanity/client'
import {
  isValidationErrorMarker,
  type PreviewValue,
  type SanityDocument,
  type Schema,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  asyncScheduler,
  combineLatest,
  defer,
  merge,
  type Observable,
  of,
  partition,
  throttleTime,
  timer,
} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  expand,
  filter,
  map,
  reduce,
  startWith,
  switchAll,
  switchMap,
} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type PerspectiveStack} from '../../../perspective/types'
import {usePerspective} from '../../../perspective/usePerspective'
import {type DocumentPreviewStore} from '../../../preview'
import {createSearch, getSearchableTypes} from '../../../search'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useSource} from '../../../studio'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  isPending?: boolean
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
}

type ReleaseDocumentsObservableResult = Observable<{
  loading: boolean
  results: DocumentInRelease[]
  error: Error | null
}>

const getActiveReleaseDocumentsObservable = ({
  schema,
  documentPreviewStore,
  i18n,
  getClient,
  releaseId,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
}): ReleaseDocumentsObservableResult => {
  const groqFilter = `sanity::partOfRelease($releaseId)`

  return documentPreviewStore
    .unstable_observeDocumentIdSet(
      groqFilter,
      {releaseId},
      {
        apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
      },
    )
    .pipe(
      map((state) => (state.documentIds || []) as string[]),
      mergeMapArray((id: string) => {
        const ctx = {
          observeDocument: documentPreviewStore.unstable_observeDocument,
          observeDocumentPairAvailability:
            documentPreviewStore.unstable_observeDocumentPairAvailability,
          i18n,
          getClient,
          schema,
        }

        const document$ = documentPreviewStore
          .unstable_observeDocument(id, {
            apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
          })
          .pipe(
            filter(Boolean),
            switchMap((doc) => {
              return documentPreviewStore.unstable_observeDocumentPairAvailability(id).pipe(
                map((availability) => ({
                  ...doc,
                  publishedDocumentExists: availability.published.available,
                })),
              )
            }),
          )

        const validation$ = document$.pipe(
          switchMap((document) => {
            if (isGoingToUnpublish(document)) {
              return of({
                isValidating: false,
                validation: [],
                revision: document._rev,
                hasError: false,
              } satisfies DocumentValidationStatus)
            }
            return validateDocumentWithReferences(ctx, of(document)).pipe(
              map((validationStatus) => ({
                ...validationStatus,
                // eslint-disable-next-line max-nested-callbacks
                hasError: validationStatus.validation.some((marker) =>
                  isValidationErrorMarker(marker),
                ),
              })),
            )
          }),
        )

        // Do not subscribe to preview streams here. Previews will be fetched lazily per rendered row.
        return combineLatest([document$, validation$]).pipe(
          map(([document, validation]) => ({
            document,
            validation,
            memoKey: uuid(),
          })),
        )
      }),
      map((results) => ({loading: false, results, error: null})),
      catchError((error) => {
        return of({loading: false, results: [], error})
      }),
    )
}

const getActiveReleaseDocumentsSearchObservable = ({
  schema,
  documentPreviewStore,
  i18n,
  getClient,
  releaseId,
  searchTerm,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  i18n: LocaleSource
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  searchTerm: string
}): ReleaseDocumentsObservableResult => {
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const groqFilter = `sanity::partOfRelease($releaseId)`

  // Set up a listener to re-run searches when the release contents change
  const events$ = defer(() =>
    client.listen(
      `*[${groqFilter}]`,
      {releaseId},
      {
        events: ['welcome', 'mutation', 'reconnect'],
        includeAllVersions: true,
        includeResult: false,
        visibility: 'query',
        tag: 'listen-release-search',
      },
    ),
  )

  const [welcome$, mutationOrReconnect$] = partition(events$, (ev) => ev.type === 'welcome')

  const types = getSearchableTypes(schema)
  const search = createSearch(types, client, {
    filter: groqFilter,
    params: {releaseId},
    perspective: [releaseId],
  })

  const doSearch$ = () =>
    search({query: searchTerm, types}, {limit: 2000, skipSortByScore: true}).pipe(
      map((res) =>
        res.hits.map(({hit}) => hit as {_id: string; _type: string; _originalId?: string}),
      ),
    )

  const observeDocumentInReleaseFromId = (baseId: string) => {
    const id = baseId
    const document$ = documentPreviewStore
      .unstable_observeDocument(id, {
        apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
      })
      .pipe(
        filter(Boolean),
        switchMap((doc) =>
          documentPreviewStore.unstable_observeDocumentPairAvailability(id).pipe(
            map((availability) => ({
              ...doc,
              publishedDocumentExists: availability.published.available,
            })),
          ),
        ),
      )

    const ctx = {
      observeDocument: documentPreviewStore.unstable_observeDocument,
      observeDocumentPairAvailability:
        documentPreviewStore.unstable_observeDocumentPairAvailability,
      i18n,
      getClient,
      schema,
    }

    const validation$ = document$.pipe(
      switchMap((document) => {
        if (isGoingToUnpublish(document)) {
          return of({
            isValidating: false,
            validation: [],
            revision: document._rev,
            hasError: false,
          } satisfies DocumentValidationStatus)
        }
        return validateDocumentWithReferences(ctx, of(document)).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        )
      }),
    )

    const previewValues$ = document$.pipe(
      map((document) => {
        const schemaType = schema.get(document._type)
        if (!schemaType) {
          console.error(
            `Schema type not found for document type ${document._type} (document ID: ${document._id})`,
          )
          return of({
            isLoading: false,
            values: {
              _id: document._id,
              title: `Document type "${document._type}" not found`,
              _createdAt: document._createdAt,
              _updatedAt: document._updatedAt,
            } satisfies PreviewValue,
          })
        }
        return documentPreviewStore
          .observeForPreview(document, schemaType, {perspective: [releaseId]})
          .pipe(
            switchMap((value) => {
              if (value.snapshot) {
                return of(value)
              }
              const publishedId = getPublishedId(document._id)
              return documentPreviewStore.observeForPreview(
                {
                  _id: publishedId,
                },
                schemaType,
                {
                  perspective: [],
                },
              )
            }),
            map(({snapshot}) => ({
              isLoading: false,
              values: snapshot,
            })),
            startWith({isLoading: true, values: {}}),
          )
      }),
      switchAll(),
    )

    return combineLatest([document$, validation$, previewValues$]).pipe(
      map(([document, validation, previewValues]) => ({
        document,
        validation,
        previewValues,
        memoKey: uuid(),
      })),
    )
  }

  return merge(
    welcome$,
    mutationOrReconnect$.pipe(throttleTime(1000, asyncScheduler, {leading: true, trailing: true})),
  ).pipe(
    switchMap((event) => {
      if (event.type === 'mutation' && event.visibility !== 'query') {
        return timer(1200).pipe(switchMap(() => doSearch$()))
      }
      // 'welcome' or other events - run search
      return doSearch$()
    }),
    // Map the hits to the same structure as the non-search path
    switchMap((hits: Array<{_id: string; _type: string; _originalId?: string}>) => {
      if (!Array.isArray(hits) || hits.length === 0) {
        return of({loading: false, results: [], error: null})
      }

      const observables = hits.map((hit) => {
        const baseId = hit._originalId || hit._id
        return observeDocumentInReleaseFromId(baseId)
      })
      return combineLatest(observables).pipe(
        map((results) => ({loading: false, results, error: null})),
      )
    }),
    startWith({loading: true, results: [], error: null}),
    catchError((error) => {
      return of({loading: false, results: [], error})
    }),
  )
}

const getPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  release,
}: {
  getClient: ReturnType<typeof useSource>['getClient']
  release: ReleaseDocument
}): ReleaseDocumentsObservableResult => {
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const dataset = client.config().dataset

  if (!release.finalDocumentStates?.length) return of({loading: false, results: [], error: null})

  function batchRequestDocumentFromHistory(startIndex: number) {
    const finalIndex = startIndex + 10
    return observableClient
      .request<{documents: DocumentInRelease['document'][]}>({
        url: `/data/history/${dataset}/documents/${release.finalDocumentStates
          ?.slice(startIndex, finalIndex)
          .map((d) => d.id)
          .join(',')}?lastRevision=true`,
      })
      .pipe(map(({documents}) => ({documents, finalIndex})))
  }

  const documents$ = batchRequestDocumentFromHistory(0).pipe(
    expand((response) => {
      if (release.finalDocumentStates && response.finalIndex < release.finalDocumentStates.length) {
        // Continue with next batch
        return batchRequestDocumentFromHistory(response.finalIndex)
      }
      // End recursion by emitting an empty observable
      return of()
    }),
    reduce(
      (documents: DocumentInRelease['document'][], batch) => documents.concat(batch.documents),
      [],
    ),
  )

  return documents$.pipe(
    map((documents) => ({
      loading: false,
      results: documents.map((document) => ({
        document,
        memoKey: uuid(),
        validation: {validation: [], hasError: false, isValidating: false},
      })),
      error: null,
    })),
    catchError((error) => {
      return of({loading: false, results: [], error})
    }),
  )
}

const getReleaseDocumentsObservable = ({
  schema,
  documentPreviewStore,
  getClient,
  releaseId,
  i18n,
  releasesState$,
  perspectiveStack,
  searchTerm,
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  i18n: LocaleSource
  releasesState$: ReturnType<typeof useReleasesStore>['state$']
  perspectiveStack: PerspectiveStack
  searchTerm?: string | null
}): ReleaseDocumentsObservableResult =>
  releasesState$.pipe(
    map((releasesState) =>
      releasesState.releases.get(getReleaseDocumentIdFromReleaseId(releaseId)),
    ),
    filter(Boolean),
    distinctUntilChanged((prev, next) => prev._rev === next._rev),
    switchMap((release) => {
      if (release.state === 'published' || release.state === 'archived') {
        return getPublishedArchivedReleaseDocumentsObservable({
          getClient,
          release,
        })
      }

      if (searchTerm && searchTerm.trim().length > 0) {
        return getActiveReleaseDocumentsSearchObservable({
          schema,
          documentPreviewStore,
          i18n,
          getClient,
          releaseId,
          searchTerm,
        })
      }

      return getActiveReleaseDocumentsObservable({
        schema,
        documentPreviewStore,
        i18n,
        getClient,
        releaseId,
      })
    }),
    startWith({loading: true, results: [], error: null}),
  )

export function useBundleDocuments(
  releaseId: string,
  options?: {searchTerm?: string | null},
): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const {state$: releasesState$} = useReleasesStore()
  const {perspectiveStack} = usePerspective()
  const searchTerm = options?.searchTerm

  const releaseDocumentsObservable = useMemo(
    () =>
      getReleaseDocumentsObservable({
        schema,
        documentPreviewStore,
        getClient,
        releaseId,
        i18n,
        releasesState$,
        perspectiveStack,
        searchTerm,
      }),
    [
      schema,
      documentPreviewStore,
      getClient,
      releaseId,
      i18n,
      releasesState$,
      perspectiveStack,
      searchTerm,
    ],
  )

  return useObservable(releaseDocumentsObservable, {loading: true, results: [], error: null})
}
