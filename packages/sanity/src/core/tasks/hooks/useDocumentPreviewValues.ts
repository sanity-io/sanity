import {type PreviewValue} from '@sanity/types'
import {type ElementType, type ReactNode, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {useSchema} from '../../hooks'
import {usePerspective} from '../../perspective/usePerspective'
import {getPreviewStateObservable} from '../../preview'
import {useDocumentPreviewStore} from '../../store'

interface PreviewHookOptions {
  documentId: string
  documentType: string
  // to make sure that you can get the preview values for a document in a specific perspective stack
  perspectiveStack: string[]
}

interface PreviewHookValue {
  isLoading: boolean
  value: Partial<PreviewValue> | null
}

/** @internal */
export function useDocumentPreviewValues(options: PreviewHookOptions): PreviewHookValue {
  const {documentId, documentType, perspectiveStack: perspectiveStackFromOptions} = options || {}
  const schemaType = useSchema().get(documentType)

  const documentPreviewStore = useDocumentPreviewStore()
  // keeping it for now as to make sure that we can safely remove it later
  // the reason to not remove it now is that it would cause a breaking change
  // during run time and we want to avoid that for now (so we left the perspectiveStack in the props as mandatory)
  // @TODO remove
  const {perspectiveStack} = usePerspective()
  const previewStateObservable = useMemo(() => {
    if (!documentId || !schemaType) return of(null)
    return getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      documentId,
      perspectiveStackFromOptions ?? perspectiveStack,
    )
  }, [documentId, documentPreviewStore, schemaType, perspectiveStackFromOptions, perspectiveStack])
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
