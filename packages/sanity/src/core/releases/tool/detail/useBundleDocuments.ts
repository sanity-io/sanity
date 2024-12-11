import {isValidationErrorMarker, type SanityDocument} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, from, of} from 'rxjs'
import {filter, map, mergeMap, startWith, switchAll, switchMap, take, toArray} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from 'sanity'

import {useClient, useSchema} from '../../../hooks'
import {getPreviewValueWithFallback, prepareForPreview} from '../../../preview'
import {useSource} from '../../../studio'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'
import {getReleaseIdFromReleaseDocumentId, useDocumentPreviewStore, useReleases} from '../../index'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInRelease {
  memoKey: string
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
  previewValues: {isLoading: boolean; values: ReturnType<typeof prepareForPreview>}
}

export function useBundleDocuments(releaseId: string): {
  loading: boolean
  results: DocumentInRelease[]
} {
  const groqFilter = `_id in path("versions.${releaseId}.*")`
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const {data: releases, archivedReleases} = useReleases()

  const release = releases
    .concat(archivedReleases)
    .find((candidate) => getReleaseIdFromReleaseDocumentId(candidate._id) === releaseId)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const observableClient = client.observable
  const {dataset} = client.config()

  const activeReleaseDocumentsObservable = useMemo(() => {
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
                // eslint-disable-next-line max-nested-callbacks
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
            // eslint-disable-next-line max-nested-callbacks
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
              // eslint-disable-next-line max-nested-callbacks
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
  }, [documentPreviewStore, groqFilter, i18n, getClient, schema, observableClient, releaseId])

  const publishedReleaseDocumentsObservable = useMemo(() => {
    if (!release?.finalDocumentStates?.length) return of({loading: false, results: []})

    const documentStates = release.finalDocumentStates

    return from(documentStates).pipe(
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
              // eslint-disable-next-line max-nested-callbacks
              map((version) => ({
                isLoading: false,
                values: prepareForPreview(
                  getPreviewValueWithFallback({
                    value: document,
                    version: version.snapshot || document,
                    perspective: releaseId,
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
  }, [
    dataset,
    documentPreviewStore,
    observableClient,
    release?.finalDocumentStates,
    releaseId,
    schema,
  ])

  const observable = useMemo(() => {
    if (!release) return of({loading: true, results: []})

    if (release.state === 'published' || release.state === 'archived') {
      return publishedReleaseDocumentsObservable
    }

    return activeReleaseDocumentsObservable
  }, [activeReleaseDocumentsObservable, publishedReleaseDocumentsObservable, release])

  return useObservable(observable, {loading: true, results: []})
}
