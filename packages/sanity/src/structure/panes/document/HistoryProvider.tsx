import {useContext, useState} from 'react'
import {
  getPublishedId,
  resolveBundlePerspective,
  usePerspective,
  useSource,
  useTimelineStore,
} from 'sanity'
import {HistoryContext, type HistoryContextValue} from 'sanity/_singletons'
import {usePaneRouter} from 'sanity/structure'

import {EMPTY_PARAMS} from './constants'

interface LegacyStoreProviderProps {
  children: React.ReactNode
  documentId: string
  documentType: string
}
function LegacyStoreProvider({children, documentId, documentType}: LegacyStoreProviderProps) {
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
    <HistoryContext.Provider value={{store: timelineStore, error: timelineError}}>
      {children}
    </HistoryContext.Provider>
  )
}

function EventsStoreProvider(props: LegacyStoreProviderProps) {
  return <LegacyStoreProvider {...props} />
}
export function HistoryProvider(props: LegacyStoreProviderProps) {
  const source = useSource()
  if (source.beta?.eventsAPI?.enabled) {
    return <EventsStoreProvider {...props} />
  }
  return <LegacyStoreProvider {...props} />
}
export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext)
  if (context === null) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}
