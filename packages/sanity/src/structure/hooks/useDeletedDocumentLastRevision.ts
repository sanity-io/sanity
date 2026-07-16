import {useContext} from 'react'
import {EventsContext} from 'sanity/_singletons'

/**
 * Returns the last revision of a deleted document.
 * It will only work in case the document is deleted or was published to avoid over-fetching the document history endpoint
 */
export const useDeletedDocumentLastRevision = () => {
  const revision = useContext(EventsContext)?.revision

  return {
    lastRevisionDocument: revision?.document || null,
    loading: revision?.loading || false,
  }
}
