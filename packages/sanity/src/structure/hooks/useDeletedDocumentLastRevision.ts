import {useContext, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {isDeleteDocumentVersionEvent, isDeleteDocumentGroupEvent} from 'sanity'
import {EventsContext} from 'sanity/_singletons'

/**
 * This fallback is only necessary until we remove the DocumentPaneWithLegacyTimelineStore option.
 * Because if users use that option, the EventsContext will not be available.
 * Once we remove the DocumentPaneWithLegacyTimelineStore option, we can remove this fallback.
 */
const EventsContextFallback = {
  events: [],
  lastNonDeletedRevId: null,
  getDocumentAtRevision: () => of({document: null, loading: false}),
}
/**
 * Returns the last revision of a deleted document.
 * It will only work in case the document is deleted to avoid overfetching the document history endpoint
 */
export const useDeletedDocumentLastRevision = () => {
  const {events, lastNonDeletedRevId, getDocumentAtRevision} =
    useContext(EventsContext) || EventsContextFallback

  const isDeleted =
    events.length > 0 &&
    (isDeleteDocumentVersionEvent(events[0]) || isDeleteDocumentGroupEvent(events[0]))

  const documentAtRevision$ = useMemo(() => {
    if (!lastNonDeletedRevId || !isDeleted) {
      return of({document: null, loading: false})
    }
    return getDocumentAtRevision(lastNonDeletedRevId)
  }, [getDocumentAtRevision, lastNonDeletedRevId, isDeleted])

  const documentAtRevision = useObservable(documentAtRevision$, null)

  return {
    lastRevisionDocument: documentAtRevision?.document || null,
    loading: documentAtRevision?.loading || false,
  }
}
