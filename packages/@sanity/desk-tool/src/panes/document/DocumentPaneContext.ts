import {DocumentActionDescription, DocumentBadgeDescription} from '@sanity/base'
import {Marker, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {PaneView, PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {Controller as HistoryController} from './documentHistory/history/Controller'
import {Timeline} from './documentHistory/history/Timeline'
import {TimelineMode} from './types'

// @todo: provide a TS type for this
type DocumentSchema = any

export interface DocumentPaneContextValue {
  activeViewId: string | null
  actions: DocumentActionDescription[] | null
  badges: DocumentBadgeDescription[] | null
  changesOpen: boolean
  compareValue: Partial<SanityDocument> | null
  connectionState: 'connecting' | 'reconnecting' | 'connected'
  displayed: Partial<SanityDocument> | null
  historyValue: Partial<SanityDocument> | null
  documentId: string
  documentIdRaw: string
  documentSchema: DocumentSchema | null
  documentType: string
  focusPath: Path
  handleChange: (patches: any[]) => void
  handleFocus: (nextPath: Path) => void
  handleHistoryClose: () => void
  handleHistoryOpen: () => void
  handleInspectClose: () => void
  handleKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleMenuAction: (item: PaneMenuItem) => void
  handlePaneClose: () => void
  handlePaneSplit?: () => void
  historyController: HistoryController
  index: number
  initialValue: Partial<SanityDocument>
  inspectOpen: boolean
  markers: Marker[]
  menuItems: PaneMenuItem[]
  menuItemGroups: PaneMenuItemGroup[]
  paneKey: string
  previewUrl: string | null
  ready: boolean
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineRange(since: string | null, rev: string | null): void
  timeline: Timeline
  timelineMode: TimelineMode
  title: string | null
  totalReferenceCount: number | undefined
  value: Partial<SanityDocument>
  views: PaneView[]
}

export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
