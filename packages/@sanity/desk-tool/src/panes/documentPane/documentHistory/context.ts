import {createContext} from 'react'
import {Doc} from '../types'
import {Controller} from './history/controller'
import {Timeline} from './history/timeline'

type TimelineMode = 'since' | 'rev' | 'closed'

export interface HistoryContextInstance {
  timeline: Timeline
  historyController: Controller
  displayed: Doc | null
  open(): void
  close(): void
  setRange(since: string | null, rev: string | null): void
  timelineMode: TimelineMode
  setTimelineMode: (mode: TimelineMode) => void
}

export const DocumentHistoryContext = createContext<HistoryContextInstance | null>(null)
