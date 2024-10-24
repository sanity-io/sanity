import {isValidationErrorMarker, type SanityDocument} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, of} from 'rxjs'
import {filter, map, startWith, switchAll, switchMap} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from 'sanity'

import {useClient, useSchema} from '../../../hooks'
import {getPreviewValueWithFallback, prepareForPreview} from '../../../preview'
import {useDocumentPreviewStore} from '../../../store'
import {useSource} from '../../../studio'
import {getPublishedId} from '../../../util/draftUtils'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInBundleResult {
  memoKey: string
  document: SanityDocument & {publishedDocumentExists: boolean}
  validation: DocumentValidationStatus
  previewValues: {isLoading: boolean; values: ReturnType<typeof prepareForPreview>}
}

export function useBundleDocuments(release: string): {
  loading: boolean
  results: DocumentInBundleResult[]
} {
  const groqFilter = `_id in path("versions.${release}.*")`
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()
  const observableClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS).observable

  const observable = useMemo(() => {
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
                    perspective: `release.${release}`,
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
  }, [observableClient, documentPreviewStore, getClient, groqFilter, i18n, release, schema])

  return useObservable(observable, {loading: true, results: []})
}
