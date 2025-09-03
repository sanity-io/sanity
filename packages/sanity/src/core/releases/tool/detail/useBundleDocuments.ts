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
  map,
  reduce,
  startWith,
  switchMap,
} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useSource} from '../../../studio'
import {scheduledYield} from '../../../util/postYield'
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

  // Helper function to create validation observable with scheduler.yield()
  const createValidationObservable = (ctx: any, document: SanityDocument) => {
    if (isGoingToUnpublish(document)) {
      return of({
        isValidating: false,
        validation: [],
        revision: document._rev,
        hasError: false,
      } satisfies DocumentValidationStatus)
    }

    // Add scheduler.yield() before each document validation
    return from(scheduledYield(() => Promise.resolve())).pipe(
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

  // Helper function to process a single document
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

    // Do not subscribe to preview streams here. Previews will be fetched lazily per rendered row.
    return combineLatest([document$, validation$]).pipe(
      map(([document, validation]) => ({
        document,
        validation,
        memoKey: uuid(),
      })),
    )
  }

  // Helper function to process a batch of documents
  const processBatch = (batch: string[], batchIndex: number) => {
    const batchDelay = batchIndex === 0 ? 0 : 100

    return of(batch).pipe(
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
      // Process documents in priority order: small batches first, then larger ones
      switchMap((documentIds) => {
        // If no documents, return empty results immediately
        if (documentIds.length === 0) {
          return of([])
        }

        // Process in smaller batches for better responsiveness
        const batchSize = 5
        const batches = []
        for (let i = 0; i < documentIds.length; i += batchSize) {
          batches.push(documentIds.slice(i, i + batchSize))
        }

        // Process all batches and collect all results
        return combineLatest(
          batches.map((batch, batchIndex) =>
            processBatch(batch, batchIndex).pipe(delay(batchIndex * 100)),
          ),
        ).pipe(
          // Flatten all batch results into a single array
          map((batchResults) => batchResults.flat()),
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

  return useObservable(releaseDocumentsObservable, {loading: true, results: [], error: null})
}
