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
  DocumentLanguageFilterComponent,
  DocumentPermission,
  EditStateFor,
  PatchEvent,
  PermissionCheckResult,
  StateTree,
  TimelineStore,
} from 'sanity'

/** @internal */
export interface DocumentPaneContextValue {
  actions: DocumentActionComponent[] | null
  activeViewId: string | null
  badges: DocumentBadgeComponent[] | null
  changesOpen: boolean
  closeInspector: (inspectorName?: string) => void
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  compareValue: Partial<SanityDocument> | null
  connectionState: 'connecting' | 'reconnecting' | 'connected'
  displayed: Partial<SanityDocument> | null
  documentId: string
  documentIdRaw: string
  documentType: string
  editState: EditStateFor | null
  fieldActions: DocumentFieldAction[]
  focusPath: Path
  forceCloseButton?: boolean
  index: number
  inspectOpen: boolean
  inspector: DocumentInspector | null
  inspectors: DocumentInspector[]
  menuItemGroups: PaneMenuItemGroup[]
  menuItems: PaneMenuItem[]
  onBlur: (blurredPath: Path) => void
  onChange: (event: PatchEvent) => void
  onFocus: (pathOrEvent: Path) => void
  onHistoryClose: () => void
  onHistoryOpen: () => void
  onInspectClose: () => void
  onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onMenuAction: (item: PaneMenuItem) => void
  onPaneClose: () => void
  onPaneSplit?: () => void
  onPathOpen: (path: Path) => void
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsedPath: (path: Path, expanded: boolean) => void
  onSetCollapsedFieldSet: (path: Path, expanded: boolean) => void
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void
  paneKey: string
  previewUrl?: string | null
  ready: boolean
  schemaType: ObjectSchemaType
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineRange(since: string | null, rev: string | null): void
  setIsDeleting: (state: boolean) => void
  source?: string
  timelineError: Error | null
  timelineMode: TimelineMode
  timelineStore: TimelineStore
  title: string | null
  validation: ValidationMarker[]
  value: SanityDocumentLike
  views: View[]
  formState: DocumentFormNode | null
  permissions?: PermissionCheckResult | null
  isDeleting: boolean
  isDeleted: boolean
  isPermissionsLoading: boolean
  unstable_languageFilter: DocumentLanguageFilterComponent[]
}

/** @internal */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
