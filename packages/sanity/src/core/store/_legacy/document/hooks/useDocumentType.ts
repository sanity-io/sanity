import {useEffect, useMemo, useState} from 'react'
import {getPublishedId} from '../../../../util'
import {useDocumentStore} from '../../datastores'

/** @internal */
export interface DocumentTypeResolveState {
  isLoaded: boolean
  documentType: string | undefined
}

const LOADING_STATE: DocumentTypeResolveState = {
  isLoaded: false,
  documentType: undefined,
}

/** @internal */
export function useDocumentType(documentId: string, specifiedType = '*'): DocumentTypeResolveState {
  const documentStore = useDocumentStore()
  const publishedId = getPublishedId(documentId)
  const isResolved = Boolean(specifiedType && specifiedType !== '*')

  // Memoize what a synchronously resolved state looks like (eg specified type is present),
  // in order to return the same object each time. Note that this can be "incorrect", but
  // that we won't be returning it in that case, eg: `{documentType: '*', isResolved: true}
  const SYNC_RESOLVED_STATE = useMemo(
    () => ({documentType: specifiedType, isLoaded: true}),
    [specifiedType]
  )

  // Set up our state that we'll only use when we need to reach out to the API to find
  // the document type for a given document. Otherwise we'll be using SYNC_RESOLVED_STATE.
  // For consistency (between different document ids/types), we're setting the sync resolved
  // state here as well, but it isn't strictly necessary for correct rendering.
  const [resolvedState, setDocumentType] = useState<DocumentTypeResolveState>(
    isResolved ? SYNC_RESOLVED_STATE : LOADING_STATE
  )

  // Reset documentType when documentId changes. Note that we're using the referentially
  // stable LOADING_STATE in order to prevent double rendering on initial load.
  useEffect(() => setDocumentType(LOADING_STATE), [publishedId, specifiedType])

  // Load the documentType from Content Lake, unless we're already in a resolved state
  useEffect(() => {
    if (isResolved) {
      return undefined
    }

    const sub = documentStore
      .resolveTypeForDocument(publishedId, specifiedType)
      .subscribe((documentType: string) => setDocumentType({documentType, isLoaded: true}))

    return () => sub.unsubscribe()
  }, [documentStore, publishedId, specifiedType, isResolved])

  return isResolved
    ? // `isResolved` is only true when we're _synchronously_ resolved
      SYNC_RESOLVED_STATE
    : // Using the document type resolved from the API
      resolvedState
}
