import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {useDocumentPreviewStore, useSchema, useSource} from 'sanity'

import {documentsValidation} from './validation'

export function useBundleDocumentsValidation(bundles: SanityDocument[]) {
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability, unstable_observeDocument} =
    useDocumentPreviewStore()
  const schema = useSchema()
  const bundlesIds = bundles.map((bundle) => bundle._id).join(',') // This will be stable across renders

  const observable = useMemo(() => {
    return documentsValidation(
      {
        observeDocumentPairAvailability: unstable_observeDocumentPairAvailability,
        observeDocument: unstable_observeDocument,
        schema,
        i18n,
        getClient,
      },
      bundlesIds.split(','),
    )
  }, [
    bundlesIds,
    getClient,
    i18n,
    schema,
    unstable_observeDocumentPairAvailability,
    unstable_observeDocument,
  ])
  const value = useObservable(observable, [])

  return value
}
