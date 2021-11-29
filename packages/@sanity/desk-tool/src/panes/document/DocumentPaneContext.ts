import type {DocumentActionDescription, DocumentBadgeDescription} from '@sanity/base'
import type {Marker, Path, SanityDocument} from '@sanity/types'
import type {EditStateFor} from '@sanity/base/_internal'
import {createContext} from 'react'
import type {PaneView, PaneMenuItem, PaneMenuItemGroup} from '../../types'
import type {Controller as HistoryController} from './documentHistory/history/Controller'
import type {Timeline} from './documentHistory/history/Timeline'
import type {TimelineMode} from './types'

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
  editState: EditStateFor | null
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
  handlePaneSplit: () => void
  historyController: HistoryController
  index: number
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
  value: Partial<SanityDocument>
  views: PaneView[]
}

export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
