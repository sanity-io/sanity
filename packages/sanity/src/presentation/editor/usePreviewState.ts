import {type SchemaType} from '@sanity/types'
import {useEffect, useState} from 'react'
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

export default function usePreviewState(documentId: string, schemaType?: SchemaType): PreviewState {
  const documentPreviewStore = useDocumentPreviewStore()
  const [preview, setPreview] = useState<PreviewState>({})
  const {perspectiveStack} = usePerspective()
  useEffect(() => {
    if (!schemaType) {
      return undefined
    }
    const subscription = getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId,
      perspectiveStack,
    ).subscribe((state) => {
      setPreview(state)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [documentPreviewStore, schemaType, documentId, perspectiveStack])

  return preview
}
