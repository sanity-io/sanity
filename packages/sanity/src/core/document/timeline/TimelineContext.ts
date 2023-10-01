import {createContext} from 'react'
import {TimelineStore} from './TimelineProvider'

export interface TimelineContextValue {
  timelineStore: TimelineStore
  setRange: (params: {rev?: string | null; since?: string | null}) => void
}

export const TimelineContext = createContext<TimelineContextValue | null>(null)
