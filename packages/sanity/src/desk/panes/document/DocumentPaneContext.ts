import {
  ValidationMarker,
  Path,
  SanityDocument,
  ObjectSchemaType,
  SanityDocumentLike,
} from '@sanity/types'
import {createContext} from 'react'
import {View} from '../../structureBuilder'
import {PaneMenuItem, PaneMenuItemGroup} from '../../types'
import {TimelineMode} from './types'
import {
  DocumentActionComponent,
  DocumentBadgeComponent,
  DocumentFieldAction,
  DocumentFormNode,
  DocumentInspector,
  EditStateFor,
  PatchEvent,
  PermissionCheckResult,
  StateTree,
  TimelineStore,
} from 'sanity'

/** @internal */
export interface DocumentPaneContextValue {
  // Primitive params
  documentType: string
  documentId: string
  documentIdRaw: string
  source?: string

  // Document metadata
  schemaType: ObjectSchemaType

  // View
  activeViewId: string | null

  // Document actions and document badges
  actions: DocumentActionComponent[] | null
  badges: DocumentBadgeComponent[] | null

  // field actions
  fieldActions: DocumentFieldAction[]

  // Review changes & history
  changesOpen: boolean
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineRange(since: string | null, rev: string | null): void
  timelineError: Error | null
  timelineMode: TimelineMode
  timelineStore: TimelineStore
  onHistoryOpen: () => void
  onHistoryClose: () => void

  // Document edit state & permissions
  value: SanityDocumentLike // is this same as displayed?
  editState: EditStateFor | null
  ready: boolean
  connectionState: 'connecting' | 'reconnecting' | 'connected'
  isPermissionsLoading: boolean
  permissions?: PermissionCheckResult | null

  // Form state / focus handling
  formState: DocumentFormNode | null
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  compareValue: Partial<SanityDocument> | null
  onBlur: (path: Path) => void
  onChange: (event: PatchEvent) => void
  onFocus: (path: Path) => void
  focusPath: Path
  onPathOpen: (path: Path) => void
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsedPath: (path: Path, expanded: boolean) => void
  onSetCollapsedFieldSet: (path: Path, expanded: boolean) => void

  // Validation
  validation: ValidationMarker[]

  // Pane stuff
  displayed: Partial<SanityDocument> | null // can this be removed?
  title: string | null
  paneKey: string
  index: number
  onPaneClose: () => void
  onPaneSplit?: () => void
  views: View[]

  // Inspector
  closeInspector: (inspectorName?: string) => void
  inspectOpen: boolean
  inspector: DocumentInspector | null
  inspectors: DocumentInspector[]
  onInspectClose: () => void
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void

  // Menu
  menuItemGroups: PaneMenuItemGroup[]
  menuItems: PaneMenuItem[]
  onMenuAction: (item: PaneMenuItem) => void

  onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  previewUrl?: string | null

  // Language filter
  // @todo remove
  // unstable_languageFilter: DocumentLanguageFilterComponent[]
}

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
