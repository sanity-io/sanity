import {createContext} from 'react'
import {Doc} from '../types'
import {Controller} from './history/controller'
import {Timeline} from './history/timeline'

export interface HistoryContextInstance {
  timeline: Timeline
  historyController: Controller
  displayed: Doc | null
  open(): void
  close(): void
  setRange(since: string | null, rev: string | null): void
}

export const DocumentHistoryContext = createContext<HistoryContextInstance | null>(null)
