import {type SchemaType} from '@sanity/types'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {
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
  const {perspectiveStack} = usePerspective()

  const preview$ = useMemo(
    () =>
      schemaType
        ? getPreviewStateObservable(documentPreviewStore, schemaType, documentId, perspectiveStack)
        : of(EMPTY_STATE),
    [documentPreviewStore, schemaType, documentId, perspectiveStack],
  )

  // Deferred: react-rx v5's deferral is identity-coherent, so on a document
  // id change the live snapshot wins and the previous document's preview
  // never renders under the new identity.
  return useObservable(preview$, EMPTY_STATE)
}
