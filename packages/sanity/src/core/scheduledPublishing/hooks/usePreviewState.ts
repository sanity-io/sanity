import {type SchemaType} from '@sanity/types'
import {useEffect, useState} from 'react'

import {useDocumentPreviewStore} from '../../store'
import {getPreviewStateObservable, type PaneItemPreviewState} from '../utils/paneItemHelpers'

export default function usePreviewState(
  documentId: string,
  schemaType?: SchemaType,
): PaneItemPreviewState {
  const documentPreviewStore = useDocumentPreviewStore()
  const [paneItemPreview, setPaneItemPreview] = useState<PaneItemPreviewState>({})

  useEffect(() => {
    if (!schemaType) {
      return undefined
    }
    const subscription = getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId,
      '',
    ).subscribe((state) => {
      setPaneItemPreview(state)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [documentPreviewStore, schemaType, documentId])

  return paneItemPreview
}
