import {
  type ObjectSchemaType,
  type Path,
  type SanityDocument,
  type SanityDocumentLike,
  type ValidationMarker,
} from '@sanity/types'
import {
  type DocumentActionComponent,
  type DocumentActionsContext,
  type DocumentBadgeComponent,
  type DocumentFieldAction,
  type DocumentFormNode,
  type DocumentInspector,
  type DocumentLanguageFilterComponent,
  type DocumentSyncState,
  type EditStateFor,
  type NodeChronologyProps,
  type PartialContext,
  type PatchEvent,
  type PermissionCheckResult,
  type ReleaseId,
  type StateTree,
  type TargetDocumentState,
  type TimelineStore,
} from 'sanity'

import {type View} from '../../structureBuilder/types'
import {type PaneMenuItem, type PaneMenuItemGroup} from '../../types'

/** @internal */
export interface DocumentPaneContextValue extends Pick<NodeChronologyProps, 'hasUpstreamVersion'> {
  actions: DocumentActionComponent[] | null
  activeViewId: string | null
  badges: DocumentBadgeComponent[] | null
  changesOpen: boolean
  closeInspector: (inspectorName?: string) => void
  collapsedFieldSets: StateTree<boolean> | undefined
  collapsedPaths: StateTree<boolean> | undefined
  compareValue: SanityDocument | null
  connectionState: 'connecting' | 'reconnecting' | 'connected'
  /**
   * Staged signal for whether the document's edits are reaching the
   * server: `pending` warns inline; `stalled` locks editing.
   */
  syncState: DocumentSyncState
  displayed: Partial<SanityDocument> | null
  displayInlineChanges?: boolean
  documentId: string
  documentIdRaw: string
  documentType: string
  editState: EditStateFor | null
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
  onSetMaximizedPane?: () => void
  maximized: boolean
  openInspector: (inspectorName: string, paneParams?: Record<string, string>) => void
  openPath: Path
  paneKey: string
  previewUrl?: string | null
  ready: boolean
  schemaType: ObjectSchemaType
  /**
   * @deprecated not used anymore
   * */
  setTimelineMode?: undefined
  /**
   * @deprecated not used anymore
   * */
  timelineMode?: undefined
  setTimelineRange(since: string | null, rev: string | null): void
  setIsDeleting: (state: boolean) => void
  /**
   * The document-actions context the pane resolves `document.actions` from.
   * In-pane surfaces that mirror a configured action must read this instead of
   * deriving a version type from the displayed document id.
   */
  documentActionsContext: PartialContext<DocumentActionsContext>
  /**
   * Resolution state of the document targeted by the selected perspective and variant.
   * The single source in-pane consumers should read instead of resolving the target themselves.
   */
  targetDocumentState: TargetDocumentState
  isDocumentGroupInventoryActive: boolean
  setIsDocumentGroupInventoryActive: (active: boolean) => void
  timelineError: Error | null
  /**
   * @deprecated Use the events API instead. The legacy document timeline will be removed in the next major version.
   */
  // oxlint-disable-next-line no-deprecated -- part of the deprecated legacy document timeline
  timelineStore?: TimelineStore
  title: string | null
  validation: ValidationMarker[]
  value: SanityDocumentLike
  views: View[]
  formState: DocumentFormNode | null
  /**
   * TODO: COREL - Remove this after updating sanity-assist to use <PerspectiveProvider>
   *
   * @deprecated use `usePerspective()` instead
   */
  selectedReleaseId: ReleaseId | undefined
  permissions?: PermissionCheckResult | null
  isDeleting: boolean
  isDeleted: boolean
  isPermissionsLoading: boolean
  isInitialValueLoading?: boolean
  unstable_languageFilter: DocumentLanguageFilterComponent[]

  // History specific values
  revisionId: string | null
  revisionNotFound: boolean
  lastNonDeletedRevId: string | null
  lastRevisionDocument: SanityDocument | null
}

/** @internal */
export type DocumentPaneInfoContextValue = Pick<
  DocumentPaneContextValue,
  | 'actions'
  | 'badges'
  | 'documentId'
  | 'documentIdRaw'
  | 'documentType'
  | 'fieldActions'
  | 'index'
  | 'menuItemGroups'
  | 'maximized'
  | 'onPaneClose'
  | 'onPaneSplit'
  | 'onSetMaximizedPane'
  | 'paneKey'
  | 'schemaType'
  | 'title'
  | 'views'
  | 'unstable_languageFilter'
>
