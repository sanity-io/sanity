import {isValidationErrorMarker, type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest} from 'rxjs'
import {filter, map, switchAll} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {getPreviewStateObservable, getPreviewValueWithFallback, prepareForPreview} from 'sanity'

import {useSchema} from '../../../hooks'
import {useDocumentPreviewStore} from '../../../store'
import {useSource} from '../../../studio'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../validation'

export interface DocumentValidationStatus extends ValidationStatus {
  hasError: boolean
}

export interface DocumentInBundleResult {
  document: SanityDocument
  validation: DocumentValidationStatus
  previewValues: {isLoading: boolean; values: ReturnType<typeof prepareForPreview>}
}

export function useBundleDocuments(bundle: string): {
  loading: boolean
  results: DocumentInBundleResult[]
} {
  const groqFilter = `defined(_version) &&  _id in path("${bundle}.*")`
  const documentPreviewStore = useDocumentPreviewStore()
  const {getClient, i18n} = useSource()
  const schema = useSchema()

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

        const document$ = documentPreviewStore.unstable_observeDocument(id).pipe(filter(Boolean))
        const validation$ = validateDocumentWithReferences(ctx, document$).pipe(
          map((validationStatus) => ({
            ...validationStatus,
            // eslint-disable-next-line max-nested-callbacks
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        )

        const previewValues$ = document$.pipe(
          map((d) => {
            const schemaType = schema.get(d._type)
            if (!schemaType) {
              throw new Error(`Schema type not found for document type ${d._type}`)
            }

            return getPreviewStateObservable(
              documentPreviewStore,
              schemaType,
              d._id,
              'Untitled',
              `bundle.${bundle}`,
            ).pipe(
              // eslint-disable-next-line max-nested-callbacks
              map((state) => {
                const previewValues = getPreviewValueWithFallback({
                  value: d,
                  draft: state.draft,
                  published: state.published,
                  version: state.version,
                  perspective: `bundle.${bundle}`,
                })
                return {
                  isLoading: !!state.isLoading,
                  values: prepareForPreview(previewValues, schemaType),
                }
              }),
            )
          }),
          switchAll(),
        )

        return combineLatest([document$, validation$, previewValues$]).pipe(
          map(([document, validation, previewValues]) => ({
            document,
            validation,
            previewValues,
          })),
        )
      }),
      map((results) => ({loading: false, results})),
    )
  }, [documentPreviewStore, getClient, groqFilter, i18n, schema, bundle])

  return useObservable(observable, {loading: true, results: []})
}
