import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
} from 'sanity'

import {documentsValidation} from './validation'

export function useBundleDocumentsValidation(bundles: SanityDocument[]) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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
        client,
        i18n,
        getClient,
        serverActionsEnabled: of(true),
      },
      bundlesIds.split(','),
    )
  }, [
    unstable_observeDocumentPairAvailability,
    unstable_observeDocument,
    schema,
    client,
    i18n,
    getClient,
    bundlesIds,
  ])
  const value = useObservable(observable, [])

  return value
}
