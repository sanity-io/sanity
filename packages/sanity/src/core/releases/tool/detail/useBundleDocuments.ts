import {isValidationErrorMarker} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {mergeMapArray} from 'rxjs-mergemap-array'

import {useSchema} from '../../../hooks'
import {useDocumentPreviewStore} from '../../../store'
import {useSource} from '../../../studio'
import {validateDocumentWithReferences} from '../../../validation'

export function useBundleDocuments(bundle: string) {
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
            documentId: id,
            // eslint-disable-next-line max-nested-callbacks
            hasError: validationStatus.validation.some((marker) => isValidationErrorMarker(marker)),
          })),
        )

        return combineLatest([document$, validation$]).pipe(
          map(([document, validation]) => ({document, validation})),
        )
      }),
      map((results) => ({loading: false, results})),
    )
  }, [documentPreviewStore, getClient, groqFilter, i18n, schema])

  return useObservable(observable, {loading: true, results: []})
}
