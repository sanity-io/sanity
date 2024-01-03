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

/**
 * @deprecated use one of the new provider contexts instead
 * @internal
 */
export const DocumentPaneContext = createContext<DocumentPaneContextValue | null>(null)
DocumentPaneContext.displayName = 'DocumentPaneContext'

/** @internal */
export const DocumentPaneContextActions = createContext<DocumentPaneContextValue['actions']>(null)
DocumentPaneContextActions.displayName = 'DocumentPaneContextActions'

/** @internal */
export const DocumentPaneContextActiveViewId =
  createContext<DocumentPaneContextValue['activeViewId']>(null)
DocumentPaneContextActiveViewId.displayName = 'DocumentPaneContextActiveViewId'

/** @internal */
export const DocumentPaneContextBadges = createContext<DocumentPaneContextValue['badges']>(null)
DocumentPaneContextBadges.displayName = 'DocumentPaneContextBadges'

/** @internal */
export const DocumentPaneContextChangesOpen = createContext<
  DocumentPaneContextValue['changesOpen'] | null
>(null)
DocumentPaneContextChangesOpen.displayName = 'DocumentPaneContextChangesOpen'

/** @internal */
export const DocumentPaneContextCloseInspector = createContext<
  DocumentPaneContextValue['closeInspector'] | null
>(null)
DocumentPaneContextCloseInspector.displayName = 'DocumentPaneContextCloseInspector'

/** @internal */
export const DocumentPaneContextCollapsedFieldSets = createContext<
  DocumentPaneContextValue['collapsedFieldSets'] | null
>(null)
DocumentPaneContextCollapsedFieldSets.displayName = 'DocumentPaneContextCollapsedFieldSets'

/** @internal */
export const DocumentPaneContextCollapsedPaths = createContext<
  DocumentPaneContextValue['collapsedPaths'] | null
>(null)
DocumentPaneContextCollapsedPaths.displayName = 'DocumentPaneContextCollapsedPaths'

/** @internal */
export const DocumentPaneContextCompareValue =
  createContext<DocumentPaneContextValue['compareValue']>(null)
DocumentPaneContextCompareValue.displayName = 'DocumentPaneContextCompareValue'

/** @internal */
export const DocumentPaneContextConnectionState = createContext<
  DocumentPaneContextValue['connectionState'] | null
>(null)
DocumentPaneContextConnectionState.displayName = 'DocumentPaneContextConnectionState'

/** @internal */
export const DocumentPaneContextDisplayed =
  createContext<DocumentPaneContextValue['displayed']>(null)
DocumentPaneContextDisplayed.displayName = 'DocumentPaneContextDisplayed'

/** @internal */
export const DocumentPaneContextDocumentId = createContext<
  DocumentPaneContextValue['documentId'] | null
>(null)
DocumentPaneContextDocumentId.displayName = 'DocumentPaneContextDocumentId'

/** @internal */
export const DocumentPaneContextDocumentIdRaw = createContext<
  DocumentPaneContextValue['documentIdRaw'] | null
>(null)
DocumentPaneContextDocumentIdRaw.displayName = 'DocumentPaneContextDocumentIdRaw'

/** @internal */
export const DocumentPaneContextDocumentType = createContext<
  DocumentPaneContextValue['documentType'] | null
>(null)
DocumentPaneContextDocumentType.displayName = 'DocumentPaneContextDocumentType'

/** @internal */
export const DocumentPaneContextEditState =
  createContext<DocumentPaneContextValue['editState']>(null)
DocumentPaneContextEditState.displayName = 'DocumentPaneContextEditState'

/** @internal */
export const DocumentPaneContextFieldActions = createContext<
  DocumentPaneContextValue['fieldActions'] | null
>(null)
DocumentPaneContextFieldActions.displayName = 'DocumentPaneContextFieldActions'

/** @internal */
export const DocumentPaneContextFocusPath = createContext<
  DocumentPaneContextValue['focusPath'] | null
>(null)
DocumentPaneContextFocusPath.displayName = 'DocumentPaneContextFocusPath'

/** @internal */
export const DocumentPaneContextIndex = createContext<DocumentPaneContextValue['index'] | null>(
  null,
)
DocumentPaneContextIndex.displayName = 'DocumentPaneContextIndex'

/** @internal */
export const DocumentPaneContextInspectOpen = createContext<
  DocumentPaneContextValue['inspectOpen'] | null
>(null)
DocumentPaneContextInspectOpen.displayName = 'DocumentPaneContextInspectOpen'

/** @internal */
export const DocumentPaneContextInspector =
  createContext<DocumentPaneContextValue['inspector']>(null)
DocumentPaneContextInspector.displayName = 'DocumentPaneContextInspector'

/** @internal */
export const DocumentPaneContextInspectors = createContext<
  DocumentPaneContextValue['inspectors'] | null
>(null)
DocumentPaneContextInspectors.displayName = 'DocumentPaneContextInspectors'

/** @internal */
export const DocumentPaneContextMenuItemGroups = createContext<
  DocumentPaneContextValue['menuItemGroups'] | null
>(null)
DocumentPaneContextMenuItemGroups.displayName = 'DocumentPaneContextMenuItemGroups'

/** @internal */
export const DocumentPaneContextOnBlur = createContext<DocumentPaneContextValue['onBlur'] | null>(
  null,
)
DocumentPaneContextOnBlur.displayName = 'DocumentPaneContextOnBlur'

/** @internal */
export const DocumentPaneContextOnChange = createContext<
  DocumentPaneContextValue['onChange'] | null
>(null)
DocumentPaneContextOnChange.displayName = 'DocumentPaneContextOnChange'

/** @internal */
export const DocumentPaneContextOnFocus = createContext<DocumentPaneContextValue['onFocus'] | null>(
  null,
)
DocumentPaneContextOnFocus.displayName = 'DocumentPaneContextOnFocus'

/** @internal */
export const DocumentPaneContextOnHistoryClose = createContext<
  DocumentPaneContextValue['onHistoryClose'] | null
>(null)
DocumentPaneContextOnHistoryClose.displayName = 'DocumentPaneContextOnHistoryClose'

/** @internal */
export const DocumentPaneContextOnHistoryOpen = createContext<
  DocumentPaneContextValue['onHistoryOpen'] | null
>(null)
DocumentPaneContextOnHistoryOpen.displayName = 'DocumentPaneContextOnHistoryOpen'

/** @internal */
export const DocumentPaneContextOnInspectClose = createContext<
  DocumentPaneContextValue['onInspectClose'] | null
>(null)
DocumentPaneContextOnInspectClose.displayName = 'DocumentPaneContextOnInspectClose'

/** @internal */
export const DocumentPaneContextOnMenuAction = createContext<
  DocumentPaneContextValue['onMenuAction'] | null
>(null)
DocumentPaneContextOnMenuAction.displayName = 'DocumentPaneContextOnMenuAction'

/** @internal */
export const DocumentPaneContextOnPaneClose = createContext<
  DocumentPaneContextValue['onPaneClose'] | null
>(null)
DocumentPaneContextOnPaneClose.displayName = 'DocumentPaneContextOnPaneClose'

/** @internal */
export const DocumentPaneContextOnPaneSplit = createContext<
  DocumentPaneContextValue['onPaneSplit'] | null
>(null)
DocumentPaneContextOnPaneSplit.displayName = 'DocumentPaneContextOnPaneSplit'

/** @internal */
export const DocumentPaneContextOnPathOpen = createContext<
  DocumentPaneContextValue['onPathOpen'] | null
>(null)
DocumentPaneContextOnPathOpen.displayName = 'DocumentPaneContextOnPathOpen'

/** @internal */
export const DocumentPaneContextOnSetActiveFieldGroup = createContext<
  DocumentPaneContextValue['onSetActiveFieldGroup'] | null
>(null)
DocumentPaneContextOnSetActiveFieldGroup.displayName = 'DocumentPaneContextOnSetActiveFieldGroup'

/** @internal */
export const DocumentPaneContextOnSetCollapsedPath = createContext<
  DocumentPaneContextValue['onSetCollapsedPath'] | null
>(null)
DocumentPaneContextOnSetCollapsedPath.displayName = 'DocumentPaneContextOnSetCollapsedPath'

/** @internal */
export const DocumentPaneContextOnSetCollapsedFieldSet = createContext<
  DocumentPaneContextValue['onSetCollapsedFieldSet'] | null
>(null)
DocumentPaneContextOnSetCollapsedFieldSet.displayName = 'DocumentPaneContextOnSetCollapsedFieldSet'

/** @internal */
export const DocumentPaneContextOpenInspector = createContext<
  DocumentPaneContextValue['openInspector'] | null
>(null)
DocumentPaneContextOpenInspector.displayName = 'DocumentPaneContextOpenInspector'

/** @internal */
export const DocumentPaneContextPaneKey = createContext<DocumentPaneContextValue['paneKey'] | null>(
  null,
)
DocumentPaneContextPaneKey.displayName = 'DocumentPaneContextPaneKey'

/** @internal */
export const DocumentPaneContextPreviewUrl =
  createContext<DocumentPaneContextValue['previewUrl']>(null)
DocumentPaneContextPreviewUrl.displayName = 'DocumentPaneContextPreviewUrl'

/** @internal */
export const DocumentPaneContextReady = createContext<DocumentPaneContextValue['ready'] | null>(
  null,
)
DocumentPaneContextReady.displayName = 'DocumentPaneContextReady'

/** @internal */
export const DocumentPaneContextSchemaType = createContext<
  DocumentPaneContextValue['schemaType'] | null
>(null)
DocumentPaneContextSchemaType.displayName = 'DocumentPaneContextSchemaType'

/** @internal */
export const DocumentPaneContextSetTimelineMode = createContext<
  DocumentPaneContextValue['setTimelineMode'] | null
>(null)
DocumentPaneContextSetTimelineMode.displayName = 'DocumentPaneContextSetTimelineMode'

/** @internal */
export const DocumentPaneContextSetTimelineRange = createContext<
  DocumentPaneContextValue['setTimelineRange'] | null
>(null)
DocumentPaneContextSetTimelineRange.displayName = 'DocumentPaneContextSetTimelineRange'

/** @internal */
export const DocumentPaneContextSetIsDeleting = createContext<
  DocumentPaneContextValue['setIsDeleting'] | null
>(null)
DocumentPaneContextSetIsDeleting.displayName = 'DocumentPaneContextSetIsDeleting'

/** @internal */
export const DocumentPaneContextTimelineError =
  createContext<DocumentPaneContextValue['timelineError']>(null)
DocumentPaneContextTimelineError.displayName = 'DocumentPaneContextTimelineError'

/** @internal */
export const DocumentPaneContextTimelineMode = createContext<
  DocumentPaneContextValue['timelineMode'] | null
>(null)
DocumentPaneContextTimelineMode.displayName = 'DocumentPaneContextTimelineMode'

/** @internal */
export const DocumentPaneContextTimelineStore = createContext<
  DocumentPaneContextValue['timelineStore'] | null
>(null)
DocumentPaneContextTimelineStore.displayName = 'DocumentPaneContextTimelineStore'

/** @internal */
export const DocumentPaneContextTitle = createContext<DocumentPaneContextValue['title']>(null)
DocumentPaneContextTitle.displayName = 'DocumentPaneContextTitle'

/** @internal */
export const DocumentPaneContextValidation = createContext<
  DocumentPaneContextValue['validation'] | null
>(null)
DocumentPaneContextValidation.displayName = 'DocumentPaneContextValidation'

/** @internal */
export const DocumentPaneContextValueContext = createContext<
  DocumentPaneContextValue['value'] | null
>(null)
DocumentPaneContextValueContext.displayName = 'DocumentPaneContextValueContext'

/** @internal */
export const DocumentPaneContextViews = createContext<DocumentPaneContextValue['views'] | null>(
  null,
)
DocumentPaneContextViews.displayName = 'DocumentPaneContextViews'

/** @internal */
export const DocumentPaneContextFormState =
  createContext<DocumentPaneContextValue['formState']>(null)
DocumentPaneContextFormState.displayName = 'DocumentPaneContextFormState'

/** @internal */
export const DocumentPaneContextPermissions =
  createContext<DocumentPaneContextValue['permissions']>(null)
DocumentPaneContextPermissions.displayName = 'DocumentPaneContextPermissions'

/** @internal */
export const DocumentPaneContextIsDeleting = createContext<
  DocumentPaneContextValue['isDeleting'] | null
>(null)
DocumentPaneContextIsDeleting.displayName = 'DocumentPaneContextIsDeleting'

/** @internal */
export const DocumentPaneContextIsDeleted = createContext<
  DocumentPaneContextValue['isDeleted'] | null
>(null)
DocumentPaneContextIsDeleted.displayName = 'DocumentPaneContextIsDeleted'

/** @internal */
export const DocumentPaneContextIsPermissionsLoading = createContext<
  DocumentPaneContextValue['isPermissionsLoading'] | null
>(null)
DocumentPaneContextIsPermissionsLoading.displayName = 'DocumentPaneContextIsPermissionsLoading'

/** @internal */
export const DocumentPaneContextUnstableLanguageFilter = createContext<
  DocumentPaneContextValue['unstable_languageFilter'] | null
>(null)
DocumentPaneContextUnstableLanguageFilter.displayName = 'DocumentPaneContextUnstableLanguageFilter'
