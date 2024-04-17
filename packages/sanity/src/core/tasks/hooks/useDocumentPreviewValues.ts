import {type PreviewValue} from '@sanity/types'
import {type ElementType, type ReactNode} from 'react'
import {useMemoObservable} from 'react-rx'
import {of} from 'rxjs'

import {useSchema} from '../../hooks'
import {getPreviewStateObservable} from '../../preview'
import {useDocumentPreviewStore} from '../../store'

interface PreviewHookOptions {
  documentId: string
  documentType: string
}

interface PreviewHookValue {
  isLoading: boolean
  value: Partial<PreviewValue> | null
}

/** @internal */
export function useDocumentPreviewValues(options: PreviewHookOptions): PreviewHookValue {
  const {documentId, documentType} = options || {}
  const schemaType = useSchema().get(documentType)

  const documentPreviewStore = useDocumentPreviewStore()

  const previewState = useMemoObservable(() => {
    if (!documentId || !schemaType) return of(null)
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, '')
  }, [documentId, documentPreviewStore, schemaType])

  const isLoading = previewState?.isLoading ?? true

  const {published, draft} = previewState || {}
  const documentTitle = (draft?.title || published?.title) as string | undefined
  const subtitle = (draft?.subtitle || published?.subtitle) as string | undefined
  const description = (draft?.description || published?.description) as string | undefined
  const media = (draft?.media || published?.media) as ReactNode | ElementType | undefined

  return {
    isLoading,
    value: {
      title: documentTitle,
      subtitle,
      media,
      description,
    },
  }
}
