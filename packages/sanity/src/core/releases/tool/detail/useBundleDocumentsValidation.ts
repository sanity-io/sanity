import {type SanityDocument} from '@sanity/types'
import {useEffect, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useDocumentPreviewStore, useSchema, useSource} from 'sanity'

import {documentValidation} from './validation'

export function useBundleDocumentsValidation(bundles: SanityDocument[]) {
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability} = useDocumentPreviewStore()
  const schema = useSchema()
  const bundle = bundles[0]

  const observable = useMemo(() => {
    const validationStatus = documentValidation(
      {
        observeDocumentPairAvailability: unstable_observeDocumentPairAvailability,
        schema,
        i18n,
        getClient,
      },
      bundle,
    )
    return validationStatus
  }, [bundle, getClient, i18n, schema, unstable_observeDocumentPairAvailability])
  const value = useObservable(observable.validationStatusObservable)

  useEffect(() => {
    observable.updateDocument(bundle)
  }, [bundle, observable])

  return value
}
