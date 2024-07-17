import {type SanityDocument} from '@sanity/types'
import {useEffect, useMemo} from 'react'
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
import {documentValidation} from './validation'

export function useBundleDocumentsValidationOld(bundles: SanityDocument[]) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {getClient, i18n} = useSource()
  const {unstable_observeDocumentPairAvailability} = useDocumentPreviewStore()
  const schema = useSchema()
  const bundle = bundles[0]
  console.log('bundle', bundle)

  const observable = useMemo(() => {
    if (!bundle) {
      return of({validation: [], isValidating: false})
    }
    console.log('Observable update', bundle)
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

  console.log('useBundleDocumentsValidation', value)
  return null
}

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
