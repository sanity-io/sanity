import {createContext} from 'react'
import {Doc} from '../types'
import {Controller} from './history/controller'
import {Timeline, TimeRef} from './history/timeline'

export interface HistoryContextInstance {
  closeHistory: () => void
  displayed: Doc | null
  timeline: Timeline
  historyController: Controller
  historyDisplayed: 'from' | 'to'
  startTime: TimeRef | null
  toggleHistory: (startTimeId: string | null) => void
  toggleHistoryDisplayed: (value: 'from' | 'to') => void
}

export const DocumentHistoryContext = createContext<HistoryContextInstance | null>(null)
