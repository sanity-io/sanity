import {type ReleaseId} from '@sanity/client'
import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SanityDocumentLike,
  type ValidationMarker,
} from '@sanity/types'
import {
  type DocumentActionComponent,
  type DocumentBadgeComponent,
  type DocumentFieldAction,
  type DocumentFormNode,
  type DocumentInspector,
  type DocumentLanguageFilterComponent,
  type EditStateFor,
  type PatchEvent,
  type PermissionCheckResult,
  type ReleaseDocument,
  type StateTree,
  type TimelineStore,
} from 'sanity'

import {type View} from '../../structureBuilder'
import {type PaneMenuItem, type PaneMenuItemGroup} from '../../types'
import {type TimelineMode} from './types'

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
  documentVersions: ReleaseDocument[] | null
  editState: EditStateFor | null
  /**
   * Whether the document being edited exists in the checked-out release.
   */
  existsInBundle: boolean
  fieldActions: DocumentFieldAction[]
  focusPath: Path
  index: number
  inspectOpen: boolean
  inspector: DocumentInspector | null
  inspectors: DocumentInspector[]
  menuItemGroups: PaneMenuItemGroup[]
  onBlur: (blurredPath: Path) => void
  onChange: (event: PatchEvent) => void
  onFocus: (pathOrEvent: Path) => void
  onHistoryClose: () => void
  onHistoryOpen: () => void
  onInspectClose: () => void
  onMenuAction: (item: PaneMenuItem) => void
  onPaneClose: () => void
  onPaneSplit?: () => void
  onPathOpen: (path: Path) => void
  onSetActiveFieldGroup: (path: Path, groupName: string) => void
  onSetCollapsedPath: (path: Path, expanded: boolean) => void
  onSetCollapsedFieldSet: (path: Path, expanded: boolean) => void
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void
  openPath: Path
  paneKey: string
  previewUrl?: string | null
  ready: boolean
  schemaType: ObjectSchemaType
  setTimelineMode: (mode: TimelineMode) => void
  setTimelineRange(since: string | null, rev: string | null): void
  setIsDeleting: (state: boolean) => void
  timelineError: Error | null
  timelineMode: TimelineMode
  /**
   * @deprecated use `useEvents()` instead.
   * If you need to use this, opt in by setting the `beta.eventsAPI.enabled` feature flag to `true`.
   */
  timelineStore?: TimelineStore
  title: string | null
  validation: ValidationMarker[]
  value: SanityDocumentLike
  selectedReleaseId: ReleaseId | undefined
  views: View[]
  formState: DocumentFormNode | null
  permissions?: PermissionCheckResult | null
  isDeleting: boolean
  isDeleted: boolean
  isPermissionsLoading: boolean
  isInitialValueLoading?: boolean
  unstable_languageFilter: DocumentLanguageFilterComponent[]
  __internal_tasks?: {
    footerAction: React.ReactNode
  }

  // History specific
  revisionId: string | null
  lastNonDeletedRevId: string | null
}
