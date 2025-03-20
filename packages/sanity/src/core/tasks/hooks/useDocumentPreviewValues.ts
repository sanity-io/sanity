import {type PreviewValue} from '@sanity/types'
import {type ElementType, type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
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

  const previewStateObservable = useMemo(() => {
    if (!documentId || !schemaType) return of(null)
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId)
  }, [documentId, documentPreviewStore, schemaType])
  const previewState = useObservable(previewStateObservable)

  const isLoading = previewState?.isLoading ?? true

  const {snapshot} = previewState || {}
  const documentTitle = snapshot?.title as string | undefined
  const subtitle = snapshot?.subtitle as string | undefined
  const description = snapshot?.description as string | undefined
  const media = snapshot?.media as ReactNode | ElementType | undefined

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
