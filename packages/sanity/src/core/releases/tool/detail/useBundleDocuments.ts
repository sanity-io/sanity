import {type ObservableSanityClient} from '@sanity/client'
import {isValidationErrorMarker, type SanityDocument, type Schema} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {filter, map, mergeMap, startWith, switchAll, switchMap, take, toArray} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useClient, useSchema} from '../../../hooks'
import {
  type DocumentPreviewStore,
  getPreviewValueWithFallback,
  prepareForPreview,
} from '../../../preview'
import {useSource} from '../../../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {
  getReleaseIdFromReleaseDocumentId,
  type ReleaseDocument,
  useDocumentPreviewStore,
} from '../../index'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
  previewValues: {isLoading: boolean; values: ReturnType<typeof prepareForPreview>}
}

type ReleaseDocumentsObservableResult = Observable<{loading: boolean; results: DocumentInRelease[]}>

const getActiveReleaseDocumentsObservable: (
  observableClient: ObservableSanityClient,
  schema: Schema,
  documentPreviewStore: DocumentPreviewStore,
  groqFilter: string,
  i18n: LocaleSource,
  getClient: ReturnType<typeof useSource>['getClient'],
  releaseId: string,
) => ReleaseDocumentsObservableResult =
  // eslint-disable-next-line max-params
  (observableClient, schema, documentPreviewStore, groqFilter, i18n, getClient, releaseId) => {
    return documentPreviewStore.unstable_observeDocumentIdSet(groqFilter).pipe(
      map((state) => (state.documentIds || []) as string[]),
      mergeMapArray((id) => {
        const ctx = {
          observeDocument: documentPreviewStore.unstable_observeDocument,
          observeDocumentPairAvailability:
            documentPreviewStore.unstable_observeDocumentPairAvailability,
          i18n,
          getClient,
          schema,
        }

        const document$ = documentPreviewStore.unstable_observeDocument(id).pipe(
          filter(Boolean),
          switchMap((doc) =>
            observableClient
              .fetch(
                `*[_id in path("${getPublishedId(doc._id)}")]{_id}`,
                {},
                {tag: 'release-documents.check-existing'},
              )
              .pipe(
                switchMap((publishedDocumentExists) =>
                  of({
                    ...doc,
                    publishedDocumentExists: !!publishedDocumentExists.length,
                  }),
                ),
              ),
          ),
        )
        const validation$ = validateDocumentWithReferences(ctx, document$).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        )

        const previewValues$ = document$.pipe(
          map((document) => {
            const schemaType = schema.get(document._type)
            if (!schemaType) {
              throw new Error(`Schema type not found for document type ${document._type}`)
            }

            return documentPreviewStore.observeForPreview(document, schemaType).pipe(
              map((version) => ({
                isLoading: false,
                values: prepareForPreview(
                  getPreviewValueWithFallback({
                    value: document,
                    version: version.snapshot,
                    perspective: releaseId,
                  }),
                  schemaType,
                ),
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
      }),
      map((results) => ({loading: false, results})),
    )
  }

const getPublishedArchivedReleaseDocumentsObservable: (
  observableClient: ObservableSanityClient,
  schema: Schema,
  documentPreviewStore: DocumentPreviewStore,
  dataset: string | undefined,
  release: ReleaseDocument,
) => ReleaseDocumentsObservableResult = (
  observableClient,
  schema,
  documentPreviewStore,
  dataset,
  release,
) => {
  if (!release.finalDocumentStates?.length) return of({loading: false, results: []})

  return from(release.finalDocumentStates || []).pipe(
    mergeMap(({id: documentId}) => {
      const document$ = observableClient
        .request<{documents: DocumentInRelease['document'][]}>({
          url: `/data/history/${dataset}/documents/${documentId}?lastRevision=true`,
        })
        .pipe(map(({documents: [document]}) => document))

      const previewValues$ = document$.pipe(
        switchMap((document) => {
          const schemaType = schema.get(document._type)
          if (!schemaType) {
            throw new Error(`Schema type not found for document type ${document._type}`)
          }

          return documentPreviewStore.observeForPreview(document, schemaType).pipe(
            take(1),
            map((version) => ({
              isLoading: false,
              values: prepareForPreview(
                getPreviewValueWithFallback({
                  value: document,
                  version: version.snapshot || document,
                  perspective: getReleaseIdFromReleaseDocumentId(release._id),
                }),
                schemaType,
              ),
            })),
            startWith({isLoading: true, values: {}}),
          )
        }),
        filter(({isLoading}) => !isLoading),
      )

      return combineLatest([document$, previewValues$]).pipe(
        map(([document, previewValues]) => ({
          document,
          previewValues,
          memoKey: uuid(),
          validation: {validation: [], hasError: false, isValidating: false},
        })),
      )
    }),
    toArray(),
    map((results) => ({
      loading: false,
      results,
    })),
  )
}

const getReleaseDocumentsObservable: (
  observableClient: ObservableSanityClient,
  schema: Schema,
  documentPreviewStore: DocumentPreviewStore,
  dataset: string | undefined,
  getClient: ReturnType<typeof useSource>['getClient'],
  releaseId: string,
  groqFilter: string,
  i18n: LocaleSource,
  releasesState$: ReturnType<typeof useReleasesStore>['state$'],
) => ReleaseDocumentsObservableResult = (
  observableClient,
  schema,
  documentPreviewStore,
  dataset,
  getClient,
  releaseId,
  groqFilter,
  i18n,
  releasesState$,
  // eslint-disable-next-line max-params
) =>
  releasesState$.pipe(
    map((releasesState) =>
      releasesState.releases.get(getReleaseDocumentIdFromReleaseId(releaseId)),
    ),
    switchMap((release) => {
      if (!release) return of({loading: true, results: []})

      const {state} = release

      if (state === 'published' || state === 'archived') {
        return getPublishedArchivedReleaseDocumentsObservable(
          observableClient,
          schema,
          documentPreviewStore,
          dataset,
          release,
        )
      }

      return getActiveReleaseDocumentsObservable(
        observableClient,
        schema,
        documentPreviewStore,
        groqFilter,
        i18n,
        getClient,
        releaseId,
      )
    }),
  )

export function useBundleDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInRelease[]
} {
  const groqFilter = `_id in path("versions.${releaseId}.*")`
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const {state$: releasesState$} = useReleasesStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const {dataset} = client.config()

  const releaseDocumentsObservable = useMemo(
    () =>
      getReleaseDocumentsObservable(
        observableClient,
        schema,
        documentPreviewStore,
        dataset,
        getClient,
        releaseId,
        groqFilter,
        i18n,
        releasesState$,
      ),
    [
      observableClient,
      schema,
      documentPreviewStore,
      dataset,
      getClient,
      releaseId,
      groqFilter,
      i18n,
      releasesState$,
    ],
  )

  return useObservable(releaseDocumentsObservable, {loading: true, results: []})
}
