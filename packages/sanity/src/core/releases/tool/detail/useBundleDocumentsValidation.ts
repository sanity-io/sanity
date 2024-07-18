import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, of} from 'rxjs'
import {
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getDraftId,
  getPublishedId,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
} from 'sanity'

import {validation} from '../../../store/_legacy/document/document-pair/validation'
import {documentsValidation} from './validation'

/**
 * This uses the same validation that exists in the document pair store.
 */
export function useBundleDocumentsValidationOld(bundles: SanityDocument[]) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability} = useDocumentPreviewStore()
  const schema = useSchema()
  const bundle = bundles[0]

  const observable = useMemo(() => {
    if (!bundle) {
      return of({validation: [], isValidating: false})
    }
    const documentSubject = new BehaviorSubject(bundle)
    const document = documentSubject.asObservable()

    documentSubject.next(bundle)

    const validationStatus = validation(
      {
        client,
        getClient,
        observeDocumentPairAvailability: unstable_observeDocumentPairAvailability,
        schema,
        i18n,
        serverActionsEnabled: of(true),
      },
      {
        draftIds: [getDraftId(bundle._id)],
        publishedId: getPublishedId(bundle._id, true),
      },
      bundle._type,
      document,
    )
    return validationStatus
  }, [bundle, client, getClient, i18n, schema, unstable_observeDocumentPairAvailability])
  const value = useObservable(observable, {validation: [], isValidating: false})
  return [value]
}

export function useBundleDocumentsValidation(bundles: SanityDocument[]) {
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability, unstable_observeDocuments} =
    useDocumentPreviewStore()
  const schema = useSchema()

  const observable = useMemo(() => {
    return documentsValidation(
      {
        observeDocumentPairAvailability: unstable_observeDocumentPairAvailability,
        observeDocuments: unstable_observeDocuments,
        schema,
        i18n,
        getClient,
      },
      bundles,
    )
  }, [bundles, getClient, i18n, schema, unstable_observeDocumentPairAvailability])
  const value = useObservable(observable.observable, [])

  return value
}
