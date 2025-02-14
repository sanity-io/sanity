import {
  isValidationErrorMarker,
  type PreviewValue,
  type SanityDocument,
  type Schema,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, type Observable, of} from 'rxjs'
import {
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  startWith,
  switchAll,
  switchMap,
  take,
  toArray,
} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {
  type DocumentPreviewStore,
  getPreviewValueWithFallback,
  prepareForPreview,
} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useSource} from '../../../studio'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {type ReleaseDocument} from '../../store/types'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  isPending?: boolean
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
  previewValues: {isLoading: boolean; values: ReturnType<typeof prepareForPreview>}
}

type ReleaseDocumentsObservableResult = Observable<{loading: boolean; results: DocumentInRelease[]}>

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
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable

  const groqFilter = `_id in path("versions.${releaseId}.*")`

  return documentPreviewStore
    .unstable_observeDocumentIdSet(groqFilter, undefined, {
      apiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
    })
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

const getPublishedArchivedReleaseDocumentsObservable = ({
  getClient,
  schema,
  documentPreviewStore,
  release,
}: {
  getClient: ReturnType<typeof useSource>['getClient']
  schema: Schema
  documentPreviewStore: DocumentPreviewStore
  release: ReleaseDocument
}): ReleaseDocumentsObservableResult => {
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const dataset = client.config().dataset

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
          schema,
          documentPreviewStore,
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
    startWith({loading: true, results: []}),
  )

export function useBundleDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInRelease[]
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

  return useObservable(releaseDocumentsObservable, {loading: true, results: []})
}
