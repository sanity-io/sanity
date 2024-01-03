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

/** @internal */
export const DocumentPaneContextActions = createContext<DocumentPaneContextValue['actions']>(null)

/** @internal */
export const DocumentPaneContextActiveViewId =
  createContext<DocumentPaneContextValue['activeViewId']>(null)

/** @internal */
export const DocumentPaneContextBadges = createContext<DocumentPaneContextValue['badges']>(null)

/** @internal */
export const DocumentPaneContextChangesOpen = createContext<
  DocumentPaneContextValue['changesOpen'] | null
>(null)

/** @internal */
export const DocumentPaneContextCloseInspector = createContext<
  DocumentPaneContextValue['closeInspector'] | null
>(null)

/** @internal */
export const DocumentPaneContextCollapsedFieldSets = createContext<
  DocumentPaneContextValue['collapsedFieldSets'] | null
>(null)

/** @internal */
export const DocumentPaneContextCollapsedPaths = createContext<
  DocumentPaneContextValue['collapsedPaths'] | null
>(null)

/** @internal */
export const DocumentPaneContextCompareValue =
  createContext<DocumentPaneContextValue['compareValue']>(null)

/** @internal */
export const DocumentPaneContextConnectionState = createContext<
  DocumentPaneContextValue['connectionState'] | null
>(null)

/** @internal */
export const DocumentPaneContextDisplayed =
  createContext<DocumentPaneContextValue['displayed']>(null)

/** @internal */
export const DocumentPaneContextDocumentId = createContext<
  DocumentPaneContextValue['documentId'] | null
>(null)

/** @internal */
export const DocumentPaneContextDocumentIdRaw = createContext<
  DocumentPaneContextValue['documentIdRaw'] | null
>(null)

/** @internal */
export const DocumentPaneContextDocumentType = createContext<
  DocumentPaneContextValue['documentType'] | null
>(null)

/** @internal */
export const DocumentPaneContextEditState =
  createContext<DocumentPaneContextValue['editState']>(null)

/** @internal */
export const DocumentPaneContextFieldActions = createContext<
  DocumentPaneContextValue['fieldActions'] | null
>(null)

/** @internal */
export const DocumentPaneContextFocusPath = createContext<
  DocumentPaneContextValue['focusPath'] | null
>(null)

/** @internal */
export const DocumentPaneContextIndex = createContext<DocumentPaneContextValue['index'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextInspectOpen = createContext<
  DocumentPaneContextValue['inspectOpen'] | null
>(null)

/** @internal */
export const DocumentPaneContextInspector =
  createContext<DocumentPaneContextValue['inspector']>(null)

/** @internal */
export const DocumentPaneContextInspectors = createContext<
  DocumentPaneContextValue['inspectors'] | null
>(null)

/** @internal */
export const DocumentPaneContextMenuItemGroups = createContext<
  DocumentPaneContextValue['menuItemGroups'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnBlur = createContext<DocumentPaneContextValue['onBlur'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextOnChange = createContext<
  DocumentPaneContextValue['onChange'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnFocus = createContext<DocumentPaneContextValue['onFocus'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextOnHistoryClose = createContext<
  DocumentPaneContextValue['onHistoryClose'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnHistoryOpen = createContext<
  DocumentPaneContextValue['onHistoryOpen'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnInspectClose = createContext<
  DocumentPaneContextValue['onInspectClose'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnMenuAction = createContext<
  DocumentPaneContextValue['onMenuAction'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnPaneClose = createContext<
  DocumentPaneContextValue['onPaneClose'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnPaneSplit = createContext<
  DocumentPaneContextValue['onPaneSplit'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnPathOpen = createContext<
  DocumentPaneContextValue['onPathOpen'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnSetActiveFieldGroup = createContext<
  DocumentPaneContextValue['onSetActiveFieldGroup'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnSetCollapsedPath = createContext<
  DocumentPaneContextValue['onSetCollapsedPath'] | null
>(null)

/** @internal */
export const DocumentPaneContextOnSetCollapsedFieldSet = createContext<
  DocumentPaneContextValue['onSetCollapsedFieldSet'] | null
>(null)

/** @internal */
export const DocumentPaneContextOpenInspector = createContext<
  DocumentPaneContextValue['openInspector'] | null
>(null)

/** @internal */
export const DocumentPaneContextPaneKey = createContext<DocumentPaneContextValue['paneKey'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextPreviewUrl =
  createContext<DocumentPaneContextValue['previewUrl']>(null)

/** @internal */
export const DocumentPaneContextReady = createContext<DocumentPaneContextValue['ready'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextSchemaType = createContext<
  DocumentPaneContextValue['schemaType'] | null
>(null)

/** @internal */
export const DocumentPaneContextSetTimelineMode = createContext<
  DocumentPaneContextValue['setTimelineMode'] | null
>(null)

/** @internal */
export const DocumentPaneContextSetTimelineRange = createContext<
  DocumentPaneContextValue['setTimelineRange'] | null
>(null)

/** @internal */
export const DocumentPaneContextSetIsDeleting = createContext<
  DocumentPaneContextValue['setIsDeleting'] | null
>(null)

/** @internal */
export const DocumentPaneContextSource = createContext<DocumentPaneContextValue['source'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextTimelineError =
  createContext<DocumentPaneContextValue['timelineError']>(null)

/** @internal */
export const DocumentPaneContextTimelineMode = createContext<
  DocumentPaneContextValue['timelineMode'] | null
>(null)

/** @internal */
export const DocumentPaneContextTimelineStore = createContext<
  DocumentPaneContextValue['timelineStore'] | null
>(null)

/** @internal */
export const DocumentPaneContextTitle = createContext<DocumentPaneContextValue['title']>(null)

/** @internal */
export const DocumentPaneContextValidation = createContext<
  DocumentPaneContextValue['validation'] | null
>(null)

/** @internal */
export const DocumentPaneContextValueContext = createContext<
  DocumentPaneContextValue['value'] | null
>(null)

/** @internal */
export const DocumentPaneContextViews = createContext<DocumentPaneContextValue['views'] | null>(
  null,
)

/** @internal */
export const DocumentPaneContextFormState =
  createContext<DocumentPaneContextValue['formState']>(null)

/** @internal */
export const DocumentPaneContextPermissions =
  createContext<DocumentPaneContextValue['permissions']>(null)

/** @internal */
export const DocumentPaneContextIsDeleting = createContext<
  DocumentPaneContextValue['isDeleting'] | null
>(null)

/** @internal */
export const DocumentPaneContextIsDeleted = createContext<
  DocumentPaneContextValue['isDeleted'] | null
>(null)

/** @internal */
export const DocumentPaneContextIsPermissionsLoading = createContext<
  DocumentPaneContextValue['isPermissionsLoading'] | null
>(null)

/** @internal */
export const DocumentPaneContextUnstableLanguageFilter = createContext<
  DocumentPaneContextValue['unstable_languageFilter'] | null
>(null)
