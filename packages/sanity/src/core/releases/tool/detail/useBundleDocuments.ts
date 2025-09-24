import {type ReleaseDocument} from '@sanity/client'
import {isValidationErrorMarker, type SanityDocument, type Schema} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {
  catchError,
  delay,
  distinctUntilChanged,
  expand,
  filter,
  finalize,
  map,
  reduce,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useSource} from '../../../studio'
import {schedulerYield} from '../../../util/schedulerYield'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {isGoingToUnpublish} from '../../util/isGoingToUnpublish'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

const bundleDocumentsCache: Record<string, ReleaseDocumentsObservableResult> = Object.create(null)

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

  // Helper function to create validation observable
  const createValidationObservable = (ctx: any, document: SanityDocument) => {
    if (isGoingToUnpublish(document)) {
      return of({
        isValidating: false,
        validation: [],
        revision: document._rev,
        hasError: false,
      } satisfies DocumentValidationStatus)
    }

    // scheduledYield is used to provide some control over the main thread
    return from(schedulerYield(() => Promise.resolve())).pipe(
      switchMap(() =>
        validateDocumentWithReferences(ctx, of(document)).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        ),
      ),
    )
  }

  // Helper function to process a single document and set up the associated validation observable
  const processDocument = (id: string) => {
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
      switchMap((document) => createValidationObservable(ctx, document)),
    )

    return combineLatest([document$, validation$]).pipe(
      map(([document, validation]) => ({
        document,
        validation,
        memoKey: uuid(),
      })),
    )
  }

  // Helper function to process a group of document Ids
  // Used to process documents as to not overwhelm the main thread
  const processDocumentIdsGroup = (documentIdsGroup: string[], groupIndex: number) => {
    // On the first batch there is no delay
    const batchDelay = groupIndex === 0 ? 0 : 100

    return of(documentIdsGroup).pipe(
      delay(batchDelay),
      mergeMapArray((id: string) => processDocument(id)),
    )
  }

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
      switchMap((documentIds) => {
        // If no documents, return empty results immediately
        if (documentIds.length === 0) {
          return of([])
        }

        // Process in smaller groups as to not overwhelm the main thread
        // depending on the browser it can handle a different number of calls at once, this felt like a good balance
        // given the tests done
        const batchSize = 5
        const documentIdsGroups = []
        for (let i = 0; i < documentIds.length; i += batchSize) {
          documentIdsGroups.push(documentIds.slice(i, i + batchSize))
        }

        // Process all batches and collect all results
        return combineLatest(
          documentIdsGroups.map((batch, batchIndex) =>
            // The delay is used to control the rate of the requests
            // It increases as it goes on as to allow for some space (in the miliseconds scale)
            // This means that technically one might expect it to take longer to get all the results, but
            // It makes the user experience better as it is not overwhelming the main thread
            // And it allows for the browser to more easily handle the requests
            processDocumentIdsGroup(batch, batchIndex).pipe(delay(batchIndex * 100)),
          ),
        ).pipe(
          // Flatten all batch results into a single array
          // This is done to avoid having to nest the results and keep the strutcture as it was before
          map((groupResults) => groupResults.flat()),
        )
      }),
      map((results) => ({loading: false, results, error: null})),
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
}: {
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  getClient: ReturnType<typeof useSource>['getClient']
  releaseId: string
  i18n: LocaleSource
  releasesState$: ReturnType<typeof useReleasesStore>['state$']
}): ReleaseDocumentsObservableResult => {
  if (!bundleDocumentsCache[releaseId]) {
    bundleDocumentsCache[releaseId] = releasesState$.pipe(
      map((releasesState) =>
        releasesState.releases.get(getReleaseDocumentIdFromReleaseId(releaseId)),
      ),
      filter(Boolean), // Removes falsey values
      distinctUntilChanged((prev, next) => {
        // Only skip re-validation if the core fields that affect document validation haven't changed
        // Return true to skip, false to trigger re-validation
        // _rev wasn't enough since it changed on every edit of the release document itself
        return prev.state === next.state && prev.finalDocumentStates === next.finalDocumentStates
      }),
      switchMap((release) => {
        // Create cache key based on fields that affect document validation + _rev
        const cacheKey = [
          releaseId,
          release.state,
          release.finalDocumentStates?.flatMap((doc) => doc.id),
          release._rev,
        ].join('-')

        if (!bundleDocumentsCache[cacheKey]) {
          let observable: ReleaseDocumentsObservableResult

          if (release.state === 'published' || release.state === 'archived') {
            observable = getPublishedArchivedReleaseDocumentsObservable({
              getClient,
              release,
            })
          } else {
            observable = getActiveReleaseDocumentsObservable({
              schema,
              documentPreviewStore,
              i18n,
              getClient,
              releaseId,
            })
          }

          bundleDocumentsCache[cacheKey] = observable.pipe(
            finalize(() => {
              delete bundleDocumentsCache[cacheKey]
            }),
            shareReplay(1),
          )
        }

        return bundleDocumentsCache[cacheKey]
      }),
      startWith({loading: true, results: [], error: null}),
      shareReplay(1),
    )
  }

  return bundleDocumentsCache[releaseId]
}

export function useBundleDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInRelease[]
  error: null | Error
} {
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const {state$: releasesState$} = useReleasesStore()

  const releaseDocumentsObservable = useMemo(
    () =>
      getReleaseDocumentsObservable({
        schema,
        documentPreviewStore,
        getClient,
        releaseId,
        i18n,
        releasesState$,
      }),
    [schema, documentPreviewStore, getClient, releaseId, i18n, releasesState$],
  )

  return useObservable(releaseDocumentsObservable, {
    loading: true,
    results: [],
    error: null,
  })
}
