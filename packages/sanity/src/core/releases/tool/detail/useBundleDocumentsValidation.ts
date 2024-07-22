import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useDocumentPreviewStore, useSchema, useSource} from 'sanity'

import {bundleDocumentsValidation, type DocumentValidationStatus} from './bundleDocumentsValidation'

export function useBundleDocumentsValidation(
  documents: SanityDocument[],
): Record<string, DocumentValidationStatus> {
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability, unstable_observeDocument} =
    useDocumentPreviewStore()
  const schema = useSchema()
  // This will be stable across renders, will emit a new one when a bundle is added or removed.
  const bundleDocumentsIds = documents.map((bundle) => bundle._id).join(',')

  const observable = useMemo(() => {
    return bundleDocumentsValidation(
      {
        observeDocumentPairAvailability: unstable_observeDocumentPairAvailability,
        observeDocument: unstable_observeDocument,
        schema,
        i18n,
        getClient,
      },
      /**
       * TODO: This is a hack to make sure the observable is stable and avoid recalculating all the validation values
       * when anything in any of the bundle changes, internally, the observable will recalculate only the value for the change bundle document.
       *
       * It will create a new observable when the ids change, and recalculate everything, which is not ideal, we will need to find a better way to handle this.
       * */
      bundleDocumentsIds.split(','),
    )
  }, [
    bundleDocumentsIds,
    getClient,
    i18n,
    schema,
    unstable_observeDocumentPairAvailability,
    unstable_observeDocument,
  ])
  const value = useObservable(observable, {})

  return value
}
