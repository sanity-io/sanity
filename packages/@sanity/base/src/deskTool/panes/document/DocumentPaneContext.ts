import {ValidationMarker, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {EditStateFor, TimelineController, Timeline} from '../../../datastores'
import {DocumentActionComponent} from '../../actions'
import {DocumentBadgeComponent} from '../../badges'
import {PaneView, PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {TimelineMode} from './types'
import {PreparedProps} from '../../../form/store/formState'

// @todo: provide a TS type for this
type DocumentSchema = any

export interface DocumentPaneContextValue {
  activeViewId: string | null
  actions: DocumentActionComponent[] | null
  badges: DocumentBadgeComponent[] | null
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
  handleHistoryClose: () => void
  handleHistoryOpen: () => void
  handleInspectClose: () => void
  handleKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  handleMenuAction: (item: PaneMenuItem) => void
  handlePaneClose: () => void
  handlePaneSplit: () => void
  historyController: TimelineController
  index: number
  inspectOpen: boolean
  validation: ValidationMarker[]
  menuItems: PaneMenuItem[]
  menuItemGroups: PaneMenuItemGroup[]
  paneKey: string
  previewUrl?: string | null
  ready: boolean
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineRange(since: string | null, rev: string | null): void
  source?: string
  timeline: Timeline
  timelineMode: TimelineMode
  title: string | null
  value: Partial<SanityDocument>
  views: PaneView[]
  formState: PreparedProps<unknown> | {hidden: true}
}

export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
