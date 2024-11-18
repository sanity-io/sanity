import {createContext} from 'sanity/_createContext'

import type {TimelineStore} from '../../core/store/_legacy/history/useTimelineStore'
import type {EventsStore} from '../../core/store/events/types'

export interface HistoryContextValue {
  store: TimelineStore
  error: Error | null
  eventsStore?: EventsStore
}
export const HistoryContext = createContext<HistoryContextValue | null>(
  'sanity/_singletons/context/history',
  null,
)
