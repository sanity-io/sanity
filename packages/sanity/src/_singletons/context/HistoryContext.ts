import {createContext} from 'sanity/_createContext'

import type {TimelineStore} from '../../core/store/_legacy/history/useTimelineStore'

export interface HistoryContextValue {
  store: TimelineStore
  error: Error | null
}
export const HistoryContext = createContext<HistoryContextValue | null>(
  'sanity/_singletons/context/history',
  null,
)
