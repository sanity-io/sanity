import {SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {Controller} from './history/Controller'
import {Timeline} from './history/Timeline'

type TimelineMode = 'since' | 'rev' | 'closed'

export interface HistoryContextInstance {
  timeline: Timeline
  historyController: Controller
  displayed: Partial<SanityDocument> | null
  open(): void
  close(): void
  setRange(since: string | null, rev: string | null): void
  timelineMode: TimelineMode
  setTimelineMode: (mode: TimelineMode) => void
}

export const DocumentHistoryContext = createContext<HistoryContextInstance | null>(null)
