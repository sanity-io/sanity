import {Path} from '@sanity/types'
import {createContext} from 'react'
import {View} from '../../structureBuilder'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {
  DocumentActionComponent,
  DocumentBadgeComponent,
  DocumentFieldAction,
  DocumentInspector,
  DocumentLanguageFilterComponent,
} from 'sanity'

/** @internal */
export interface DocumentPaneContextValue {
  actions: DocumentActionComponent[] | null
  activeViewId: string | null
  badges: DocumentBadgeComponent[] | null
  changesOpen: boolean
  closeInspector: (inspectorName?: string) => void
  fieldActions: DocumentFieldAction[]
  index: number
  inspectOpen: boolean
  inspector: DocumentInspector | null
  inspectors: DocumentInspector[]
  menuItemGroups: PaneMenuItemGroup[]
  menuItems: PaneMenuItem[]
  onHistoryClose: () => void
  onHistoryOpen: () => void
  onInspectClose: () => void
  onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onMenuAction: (item: PaneMenuItem) => void
  onPaneClose: () => void
  onPaneSplit?: () => void
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void
  paneKey: string
  previewUrl?: string | null
  source?: string
  title: string | null
  views: View[]
  unstable_languageFilter: DocumentLanguageFilterComponent[]
}

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
