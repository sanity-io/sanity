import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {
  type PreviewValue,
  type SanityDocument,
  useDocumentPreviewStore,
  usePerspective,
} from 'sanity'

import {getDefaultVariant} from '../../core/perspective/getDefaultVariant'
import {getPreviewStateObservable} from '../../core/preview/utils/getPreviewStateObservable'

interface PreviewState {
  isLoading?: boolean
  snapshot?: PreviewValue | Partial<SanityDocument> | null
}

const EMPTY_STATE: PreviewState = {}

export default function usePreviewState(documentId: string, schemaType?: SchemaType): PreviewState {
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack, selectedVariantNames} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantNames)

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
