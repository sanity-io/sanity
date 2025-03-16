import {
  isValidationErrorMarker,
  type PreviewValue,
  type SanityDocument,
  type Schema,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, type Observable, of} from 'rxjs'
import {
  catchError,
  distinctUntilChanged,
  expand,
  filter,
  map,
  mergeMap,
  reduce,
  startWith,
  switchAll,
  switchMap,
  take,
} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {type LocaleSource} from '../../../i18n/types'
import {type DocumentPreviewStore, prepareForPreview} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store/_legacy/datastores'
import {useSource} from '../../../studio'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {type ReleaseDocument} from '../../store/types'
import {useReleasesStore} from '../../store/useReleasesStore'
import {getReleaseDocumentIdFromReleaseId} from '../../util/getReleaseDocumentIdFromReleaseId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../util/releasesClient'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  isPending?: boolean
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
  previewValues: {
    isLoading: boolean
    values: PreviewValue | undefined | null
  }
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
  const client = getClient(RELEASES_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable

  const groqFilter = `_id in path("versions.${releaseId}.**")`

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
            return documentPreviewStore
              .observeForPreview(document, schemaType, {perspective: [releaseId]})
              .pipe(
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
      }),
      map((results) => ({loading: false, results, error: null})),
      catchError((error) => {
        return of({loading: false, results: [], error})
      }),
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
    mergeMap((documents) => {
      return combineLatest(
        documents.map((document) => {
          const schemaType = schema.get(document._type)
          if (!schemaType) {
            throw new Error(`Schema type not found for document type ${document._type}`)
          }
          const previewValues$ = documentPreviewStore.observeForPreview(document, schemaType).pipe(
            take(1),
            map(({snapshot}) => ({
              isLoading: false,
              values: prepareForPreview(snapshot || document, schemaType),
            })),
            startWith({isLoading: true, values: {}}),
            filter(({isLoading}) => !isLoading),
          )

          return previewValues$.pipe(
            map((previewValues) => ({
              document,
              previewValues,
              memoKey: uuid(),
              validation: {validation: [], hasError: false, isValidating: false},
            })),
          )
        }),
      ).pipe(
        map((results) => ({
          loading: false,
          results,
          error: null,
        })),
      )
    }),
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
