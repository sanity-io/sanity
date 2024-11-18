import {useContext, useState} from 'react'
import {
  type EventsStore,
  getDraftId,
  getPublishedId,
  getVersionId,
  resolveBundlePerspective,
  useEventsStore,
  usePerspective,
  useSource,
  useTimelineStore,
} from 'sanity'
import {EventsContext, HistoryContext, type HistoryContextValue} from 'sanity/_singletons'
import {usePaneRouter} from 'sanity/structure'

import {EMPTY_PARAMS} from './constants'

interface LegacyStoreProviderProps {
  children: React.ReactNode
  documentId: string
  documentType: string
}
function LegacyStoreProvider({
  children,
  documentId,
  documentType,
  eventsStore,
}: LegacyStoreProviderProps & {
  eventsStore?: EventsStore
}) {
  const paneRouter = usePaneRouter()
  const {perspective} = usePerspective()
  const bundlePerspective = resolveBundlePerspective(perspective)

  const params = paneRouter.params || EMPTY_PARAMS

  const [timelineError, setTimelineError] = useState<Error | null>(null)

  /**
   * Create an intermediate store which handles document Timeline + TimelineController
   * creation, and also fetches pre-requsite document snapshots. Compatible with `useSyncExternalStore`
   * and made available to child components via DocumentPaneContext.
   */
  const timelineStore = useTimelineStore({
    documentId: getPublishedId(documentId),
    documentType,
    onError: setTimelineError,
    rev: params.rev,
    since: params.since,
    version: bundlePerspective,
  })

  return (
    <HistoryContext.Provider value={{store: timelineStore, error: timelineError, eventsStore}}>
      {children}
    </HistoryContext.Provider>
  )
}

function EventsStoreProvider(props: LegacyStoreProviderProps) {
  const {params = EMPTY_PARAMS, setParams} = usePaneRouter()

  const {perspective} = usePerspective()
  const bundlePerspective = resolveBundlePerspective(perspective)
  const documentId =
    // eslint-disable-next-line no-nested-ternary
    typeof perspective === 'undefined'
      ? getDraftId(props.documentId)
      : // eslint-disable-next-line no-nested-ternary
        perspective === 'published'
        ? getPublishedId(props.documentId)
        : bundlePerspective
          ? getVersionId(props.documentId, bundlePerspective)
          : props.documentId

  const eventsStore = useEventsStore({
    documentId,
    rev: params.rev,
    since: params.since,
  })

  return (
    <EventsContext.Provider value={eventsStore}>
      <LegacyStoreProvider {...props} eventsStore={eventsStore} />
    </EventsContext.Provider>
  )
}
export function useEvents(): EventsStore {
  const context = useContext(EventsContext)
  if (context === null) {
    throw new Error('useEvents must be used within a EventsProvider')
  }
  return context
}

export function HistoryProvider(props: LegacyStoreProviderProps) {
  const source = useSource()

  if (source.beta?.eventsAPI?.enabled) {
    return <EventsStoreProvider {...props} />
  }
  return <LegacyStoreProvider {...props} /> // This is the timeline
}
export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext)
  if (context === null) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}
