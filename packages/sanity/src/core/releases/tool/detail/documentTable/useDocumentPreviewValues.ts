import {type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  type SchemaType,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'

import {type BundleDocument} from '../../../../store/bundles/types'

export const useDocumentPreviewValues = ({
  release,
  document,
}: {
  release: BundleDocument
  document: SanityDocument
}) => {
  const schema = useSchema()
  const schemaType = schema.get(document._type) as SchemaType | undefined
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }
  const perspective = `bundle.${release.name}`

  const documentPreviewStore = useDocumentPreviewStore()

  const previewStateObservable = useMemo(
    () =>
      getPreviewStateObservable(
        documentPreviewStore,
        schemaType,
        document._id,
        'Untitled',
        perspective,
      ),
    [document._id, documentPreviewStore, perspective, schemaType],
  )

  const {draft, published, version, isLoading} = useObservable(previewStateObservable, {
    draft: null,
    isLoading: true,
    published: null,
  })

  const previewValues = getPreviewValueWithFallback({
    value: document,
    draft,
    published,
    version,
    perspective,
  })
  return {previewValues, isLoading}
}
