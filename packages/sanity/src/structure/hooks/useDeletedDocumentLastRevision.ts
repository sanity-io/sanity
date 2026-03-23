import {useContext} from 'react'
import {EventsContext} from 'sanity/_singletons'

/**
 * This fallback is only necessary until we remove the DocumentPaneWithLegacyTimelineStore option.
 * Because if users use that option, the EventsContext will not be available.
 * Once we remove the DocumentPaneWithLegacyTimelineStore option, we can remove this fallback.
 */
const EventsContextFallback = {
  revision: null,
}
/**
 * Returns the last revision of a deleted document.
 * It will only work in case the document is deleted or was published to avoid over-fetching the document history endpoint
 */
export const useDeletedDocumentLastRevision = () => {
  const {revision} = useContext(EventsContext) || EventsContextFallback

  return {
    lastRevisionDocument: revision?.document || null,
    loading: revision?.loading || false,
  }
}
