import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {of} from 'rxjs'
import {
  getPreviewStateObservable,
  type PreviewValue,
  type SanityDocument,
  useDocumentPreviewStore,
  usePerspective,
} from 'sanity'

import {useDeferredObservableValue} from '../../core/util/useDeferredObservableValue'

interface PreviewState {
  isLoading?: boolean
  snapshot?: PreviewValue | Partial<SanityDocument> | null
}

const EMPTY_STATE: PreviewState = {}

export default function usePreviewState(documentId: string, schemaType?: SchemaType): PreviewState {
  const documentPreviewStore = useDocumentPreviewStore()
  const {perspectiveStack} = usePerspective()

  const preview$ = useMemo(
    () =>
      schemaType
        ? getPreviewStateObservable(documentPreviewStore, schemaType, documentId, perspectiveStack)
        : of(EMPTY_STATE),
    [documentPreviewStore, schemaType, documentId, perspectiveStack],
  )

  // Identity-coherent deferral: on a document id change the live snapshot
  // wins, so the previous document's preview never renders under the new
  // identity.
  return useDeferredObservableValue(preview$, EMPTY_STATE)
}
