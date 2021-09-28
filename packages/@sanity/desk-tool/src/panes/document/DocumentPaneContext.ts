import {DocumentActionDescription, DocumentBadgeDescription} from '@sanity/base'
import {EditStateFor} from '@sanity/base/_internal'
import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {Marker, Path, SanityDocument} from '@sanity/types'
import {createContext} from 'react'
import {InitialValueState} from './lib/initialValue/types'
import {DocumentView} from './types'

// @todo: provide a TS type for this
type DocumentSchema = any

export interface DocumentPaneContextValue {
  activeViewId: string | null
  actions: DocumentActionDescription[] | null
  badges: DocumentBadgeDescription[] | null
  changesOpen: boolean
  closable: boolean
  compareValue: Partial<SanityDocument> | null
  connectionState: 'connecting' | 'reconnecting' | 'connected'
  editState?: EditStateFor | null
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
  handleMenuAction: (item: MenuItem) => void
  handlePaneClose: () => void
  handlePaneSplit: () => void
  index: number
  initialValue: InitialValueState
  inspectOpen: boolean
  markers: Marker[]
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  paneKey: string
  permission: {granted: boolean; reason: string}
  previewUrl: string | null
  requiredPermission: 'create' | 'update'
  title: string | null
  value: Partial<SanityDocument>
  views: DocumentView[]
}

export const DocumentPaneContext = createContext<DocumentPaneContextValue>({
  activeViewId: null,
  actions: null,
  badges: null,
  changesOpen: false,
  closable: false,
  compareValue: null,
  connectionState: 'connecting',
  editState: null,
  documentId: '',
  documentIdRaw: '',
  documentSchema: null,
  documentType: '',
  focusPath: [],
  handleChange: () => undefined,
  handleFocus: () => undefined,
  handleHistoryClose: () => undefined,
  handleHistoryOpen: () => undefined,
  handleInspectClose: () => undefined,
  handleKeyUp: () => undefined,
  handleMenuAction: () => undefined,
  handlePaneClose: () => undefined,
  handlePaneSplit: () => undefined,
  index: 0,
  initialValue: {loading: true, error: null, value: {}},
  inspectOpen: false,
  markers: [],
  menuItems: [],
  menuItemGroups: [],
  paneKey: '',
  permission: {granted: false, reason: ''},
  previewUrl: null,
  requiredPermission: 'update',
  title: null,
  value: {},
  views: [],
})
