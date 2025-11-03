import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {getPreviewStateObservable, useDocumentPreviewStore, usePerspective, useSchema} from 'sanity'

// Hook to get a single document's preview title
export function useDocumentPreviewTitle(documentId: string | null, documentType: string | null) {
  const {perspectiveStack} = usePerspective()
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()
  const schemaType = documentType ? schema.get(documentType) : null

  const observable = useMemo(() => {
    if (!documentId || !schemaType) return of({isLoading: true, snapshot: null, original: null})
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId, perspectiveStack)
  }, [documentId, documentPreviewStore, schemaType, perspectiveStack])

  const previewState = useObservable(observable, {isLoading: true, snapshot: null})

  return {
    title: previewState?.snapshot?.title as string | undefined,
    isLoading: previewState?.isLoading ?? true,
  }
}
