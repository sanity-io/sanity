import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {
  getDefaultVariant,
  getPreviewStateObservable,
  type PreviewValue,
  type SanityDocument,
  useDocumentPreviewStore,
  usePerspective,
} from 'sanity'

interface PreviewState {
  isLoading?: boolean
  snapshot?: PreviewValue | Partial<SanityDocument> | null
}

const EMPTY_STATE: PreviewState = {}

export default function usePreviewState(documentId: string, schemaType?: SchemaType): PreviewState {
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack, selectedVariantsName} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantsName)

  const preview$ = useMemo(
    () =>
      schemaType
        ? getPreviewStateObservable(
            documentPreviewStore,
            schemaType,
            documentId,
            perspectiveStack,
            undefined,
            selectedVariantName,
          )
        : of(EMPTY_STATE),
    [documentPreviewStore, schemaType, documentId, perspectiveStack, selectedVariantName],
  )

  return useObservable(preview$, EMPTY_STATE)
}
