/* eslint-disable camelcase */
import {useContext, useDebugValue} from 'react'
import {
  DocumentPaneContext,
  DocumentPaneContextValue,
  DocumentPaneContextActions,
  DocumentPaneContextActiveViewId,
  DocumentPaneContextBadges,
  DocumentPaneContextChangesOpen,
  DocumentPaneContextCloseInspector,
  DocumentPaneContextCollapsedFieldSets,
  DocumentPaneContextCollapsedPaths,
  DocumentPaneContextCompareValue,
  DocumentPaneContextConnectionState,
  DocumentPaneContextDisplayed,
  DocumentPaneContextDocumentId,
  DocumentPaneContextDocumentIdRaw,
  DocumentPaneContextDocumentType,
  DocumentPaneContextEditState,
  DocumentPaneContextFieldActions,
  DocumentPaneContextFocusPath,
  DocumentPaneContextFormState,
  DocumentPaneContextIndex,
  DocumentPaneContextInspectOpen,
  DocumentPaneContextInspector,
  DocumentPaneContextInspectors,
  DocumentPaneContextIsDeleted,
  DocumentPaneContextIsDeleting,
  DocumentPaneContextIsPermissionsLoading,
  DocumentPaneContextMenuItemGroups,
  DocumentPaneContextOnBlur,
  DocumentPaneContextOnChange,
  DocumentPaneContextOnFocus,
  DocumentPaneContextOnHistoryClose,
  DocumentPaneContextOnHistoryOpen,
  DocumentPaneContextOnInspectClose,
  DocumentPaneContextOnMenuAction,
  DocumentPaneContextOnPaneClose,
  DocumentPaneContextOnPaneSplit,
  DocumentPaneContextOnPathOpen,
  DocumentPaneContextOnSetActiveFieldGroup,
  DocumentPaneContextOnSetCollapsedFieldSet,
  DocumentPaneContextOnSetCollapsedPath,
  DocumentPaneContextOpenInspector,
  DocumentPaneContextPaneKey,
  DocumentPaneContextPermissions,
  DocumentPaneContextPreviewUrl,
  DocumentPaneContextReady,
  DocumentPaneContextSchemaType,
  DocumentPaneContextSetIsDeleting,
  DocumentPaneContextSetTimelineMode,
  DocumentPaneContextSetTimelineRange,
  DocumentPaneContextTimelineError,
  DocumentPaneContextTimelineMode,
  DocumentPaneContextTimelineStore,
  DocumentPaneContextTitle,
  DocumentPaneContextUnstableLanguageFilter,
  DocumentPaneContextValidation,
  DocumentPaneContextValueContext,
  DocumentPaneContextViews,
} from './DocumentPaneContext'

/**
 * @deprecated use one of the new hooks
 * @internal
 */
export function useDocumentPane__LEGACY__STOP__USING(): DocumentPaneContextValue {
  const documentPane = useContext(DocumentPaneContext)

  useDebugValue('LEGACY STOP USING')

  if (!documentPane) {
    throw new Error('DocumentPane: missing context value')
  }

  return documentPane
}

/**
 * @deprecated use one of the new hooks
 * @internal
 */
export const useDocumentPane = useDocumentPane__LEGACY__STOP__USING

/** @internal */
export function useDocumentPaneActions(): DocumentPaneContextValue['actions'] {
  const context = useContext(DocumentPaneContextActions)

  return context
}

/** @internal */
export function useDocumentPaneActiveViewId(): DocumentPaneContextValue['activeViewId'] {
  const context = useContext(DocumentPaneContextActiveViewId)

  return context
}

/** @internal */
export function useDocumentPaneBadges(): DocumentPaneContextValue['badges'] {
  const context = useContext(DocumentPaneContextBadges)

  return context
}

/** @internal */
export function useDocumentPaneChangesOpen(): DocumentPaneContextValue['changesOpen'] {
  const context = useContext(DocumentPaneContextChangesOpen)

  if (context === null) {
    throw new Error('DocumentPaneChangesOpen: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneCloseInspector(): DocumentPaneContextValue['closeInspector'] {
  const context = useContext(DocumentPaneContextCloseInspector)

  if (context === null) {
    throw new Error('DocumentPaneCloseInspector: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneCollapsedFieldSets(): DocumentPaneContextValue['collapsedFieldSets'] {
  const context = useContext(DocumentPaneContextCollapsedFieldSets)

  if (context === null) {
    throw new Error('DocumentPaneCollapsedFieldSets: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneCollapsedPaths(): DocumentPaneContextValue['collapsedPaths'] {
  const context = useContext(DocumentPaneContextCollapsedPaths)

  if (context === null) {
    throw new Error('DocumentPaneCollapsedPaths: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneCompareValue(): DocumentPaneContextValue['compareValue'] {
  const context = useContext(DocumentPaneContextCompareValue)

  return context
}

/** @internal */
export function useDocumentPaneConnectionState(): DocumentPaneContextValue['connectionState'] {
  const context = useContext(DocumentPaneContextConnectionState)

  if (context === null) {
    throw new Error('DocumentPaneConnectionState: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneDisplayed(): DocumentPaneContextValue['displayed'] {
  const context = useContext(DocumentPaneContextDisplayed)

  return context
}

/** @internal */
export function useDocumentPaneDocumentId(): DocumentPaneContextValue['documentId'] {
  const context = useContext(DocumentPaneContextDocumentId)

  if (context === null) {
    throw new Error('DocumentPaneDocumentId: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneDocumentIdRaw(): DocumentPaneContextValue['documentIdRaw'] {
  const context = useContext(DocumentPaneContextDocumentIdRaw)

  if (context === null) {
    throw new Error('DocumentPaneDocumentIdRaw: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneDocumentType(): DocumentPaneContextValue['documentType'] {
  const context = useContext(DocumentPaneContextDocumentType)

  if (context === null) {
    throw new Error('DocumentPaneDocumentType: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneEditState(): DocumentPaneContextValue['editState'] {
  const context = useContext(DocumentPaneContextEditState)

  return context
}

/** @internal */
export function useDocumentPaneFieldActions(): DocumentPaneContextValue['fieldActions'] {
  const context = useContext(DocumentPaneContextFieldActions)

  if (context === null) {
    throw new Error('DocumentPaneFieldActions: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneFocusPath(): DocumentPaneContextValue['focusPath'] {
  const context = useContext(DocumentPaneContextFocusPath)

  if (context === null) {
    throw new Error('DocumentPaneFocusPath: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneFormState(): DocumentPaneContextValue['formState'] {
  const context = useContext(DocumentPaneContextFormState)

  return context
}

/** @internal */
export function useDocumentPaneIndex(): DocumentPaneContextValue['index'] {
  const context = useContext(DocumentPaneContextIndex)

  if (context === null) {
    throw new Error('DocumentPaneIndex: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneInspectOpen(): DocumentPaneContextValue['inspectOpen'] {
  const context = useContext(DocumentPaneContextInspectOpen)

  if (context === null) {
    throw new Error('DocumentPaneInspectOpen: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneInspector(): DocumentPaneContextValue['inspector'] {
  const context = useContext(DocumentPaneContextInspector)

  return context
}

/** @internal */
export function useDocumentPaneInspectors(): DocumentPaneContextValue['inspectors'] {
  const context = useContext(DocumentPaneContextInspectors)

  if (context === null) {
    throw new Error('DocumentPaneInspectors: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneIsDeleted(): DocumentPaneContextValue['isDeleted'] {
  const context = useContext(DocumentPaneContextIsDeleted)

  if (context === null) {
    throw new Error('DocumentPaneIsDeleted: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneIsDeleting(): DocumentPaneContextValue['isDeleting'] {
  const context = useContext(DocumentPaneContextIsDeleting)

  if (context === null) {
    throw new Error('DocumentPaneIsDeleting: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneIsPermissionsLoading(): DocumentPaneContextValue['isPermissionsLoading'] {
  const context = useContext(DocumentPaneContextIsPermissionsLoading)

  if (context === null) {
    throw new Error('DocumentPaneIsPermissionsLoading: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneMenuItemGroups(): DocumentPaneContextValue['menuItemGroups'] {
  const context = useContext(DocumentPaneContextMenuItemGroups)

  if (context === null) {
    throw new Error('DocumentPaneMenuItemGroups: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnBlur(): DocumentPaneContextValue['onBlur'] {
  const context = useContext(DocumentPaneContextOnBlur)

  if (context === null) {
    throw new Error('DocumentPaneOnBlur: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnChange(): DocumentPaneContextValue['onChange'] {
  const context = useContext(DocumentPaneContextOnChange)

  if (context === null) {
    throw new Error('DocumentPaneOnChange: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnFocus(): DocumentPaneContextValue['onFocus'] {
  const context = useContext(DocumentPaneContextOnFocus)

  if (context === null) {
    throw new Error('DocumentPaneOnFocus: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnHistoryClose(): DocumentPaneContextValue['onHistoryClose'] {
  const context = useContext(DocumentPaneContextOnHistoryClose)

  if (context === null) {
    throw new Error('DocumentPaneOnHistoryClose: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnHistoryOpen(): DocumentPaneContextValue['onHistoryOpen'] {
  const context = useContext(DocumentPaneContextOnHistoryOpen)

  if (context === null) {
    throw new Error('DocumentPaneOnHistoryOpen: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnInspectClose(): DocumentPaneContextValue['onInspectClose'] {
  const context = useContext(DocumentPaneContextOnInspectClose)

  if (context === null) {
    throw new Error('DocumentPaneOnInspectClose: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnMenuAction(): DocumentPaneContextValue['onMenuAction'] {
  const context = useContext(DocumentPaneContextOnMenuAction)

  if (context === null) {
    throw new Error('DocumentPaneOnMenuAction: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnPaneClose(): DocumentPaneContextValue['onPaneClose'] {
  const context = useContext(DocumentPaneContextOnPaneClose)

  if (context === null) {
    throw new Error('DocumentPaneOnPaneClose: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnPaneSplit(): DocumentPaneContextValue['onPaneSplit'] {
  const context = useContext(DocumentPaneContextOnPaneSplit)

  if (context === null) {
    throw new Error('DocumentPaneOnPaneSplit: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnPathOpen(): DocumentPaneContextValue['onPathOpen'] {
  const context = useContext(DocumentPaneContextOnPathOpen)

  if (context === null) {
    throw new Error('DocumentPaneOnPathOpen: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnSetActiveFieldGroup(): DocumentPaneContextValue['onSetActiveFieldGroup'] {
  const context = useContext(DocumentPaneContextOnSetActiveFieldGroup)

  if (context === null) {
    throw new Error('DocumentPaneOnSetActiveFieldGroup: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnSetCollapsedFieldSet(): DocumentPaneContextValue['onSetCollapsedFieldSet'] {
  const context = useContext(DocumentPaneContextOnSetCollapsedFieldSet)

  if (context === null) {
    throw new Error('DocumentPaneOnSetCollapsedFieldSet: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOnSetCollapsedPath(): DocumentPaneContextValue['onSetCollapsedPath'] {
  const context = useContext(DocumentPaneContextOnSetCollapsedPath)

  if (context === null) {
    throw new Error('DocumentPaneOnSetCollapsedPath: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneOpenInspector(): DocumentPaneContextValue['openInspector'] {
  const context = useContext(DocumentPaneContextOpenInspector)

  if (context === null) {
    throw new Error('DocumentPaneOpenInspector: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPanePaneKey(): DocumentPaneContextValue['paneKey'] {
  const context = useContext(DocumentPaneContextPaneKey)

  if (context === null) {
    throw new Error('DocumentPanePaneKey: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPanePermissions(): DocumentPaneContextValue['permissions'] {
  const context = useContext(DocumentPaneContextPermissions)

  return context
}

/** @internal */
export function useDocumentPanePreviewUrl(): DocumentPaneContextValue['previewUrl'] {
  const context = useContext(DocumentPaneContextPreviewUrl)

  return context
}

/** @internal */
export function useDocumentPaneReady(): DocumentPaneContextValue['ready'] {
  const context = useContext(DocumentPaneContextReady)

  if (context === null) {
    throw new Error('DocumentPaneReady: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneSchemaType(): DocumentPaneContextValue['schemaType'] {
  const context = useContext(DocumentPaneContextSchemaType)

  if (context === null) {
    throw new Error('DocumentPaneSchemaType: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneSetIsDeleting(): DocumentPaneContextValue['setIsDeleting'] {
  const context = useContext(DocumentPaneContextSetIsDeleting)

  if (context === null) {
    throw new Error('DocumentPaneSetIsDeleting: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneSetTimelineMode(): DocumentPaneContextValue['setTimelineMode'] {
  const context = useContext(DocumentPaneContextSetTimelineMode)

  if (context === null) {
    throw new Error('DocumentPaneSetTimelineMode: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneSetTimelineRange(): DocumentPaneContextValue['setTimelineRange'] {
  const context = useContext(DocumentPaneContextSetTimelineRange)

  if (context === null) {
    throw new Error('DocumentPaneSetTimelineRange: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneTimelineError(): DocumentPaneContextValue['timelineError'] {
  const context = useContext(DocumentPaneContextTimelineError)

  return context
}

/** @internal */
export function useDocumentPaneTimelineMode(): DocumentPaneContextValue['timelineMode'] {
  const context = useContext(DocumentPaneContextTimelineMode)

  if (context === null) {
    throw new Error('DocumentPaneTimelineMode: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneTimelineStore(): DocumentPaneContextValue['timelineStore'] {
  const context = useContext(DocumentPaneContextTimelineStore)

  if (context === null) {
    throw new Error('DocumentPaneTimelineStore: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneTitle(): DocumentPaneContextValue['title'] {
  const context = useContext(DocumentPaneContextTitle)

  return context
}

/** @internal */
export function useDocumentPaneUnstableLanguageFilter(): DocumentPaneContextValue['unstable_languageFilter'] {
  const context = useContext(DocumentPaneContextUnstableLanguageFilter)

  if (context === null) {
    throw new Error('DocumentPaneUnstableLanguageFilter: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneValidation(): DocumentPaneContextValue['validation'] {
  const context = useContext(DocumentPaneContextValidation)

  if (context === null) {
    throw new Error('DocumentPaneValidation: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneValue(): DocumentPaneContextValue['value'] {
  const context = useContext(DocumentPaneContextValueContext)

  if (context === null) {
    throw new Error('DocumentPaneValue: missing context value')
  }

  return context
}

/** @internal */
export function useDocumentPaneViews(): DocumentPaneContextValue['views'] {
  const context = useContext(DocumentPaneContextViews)

  if (context === null) {
    throw new Error('DocumentPaneViews: missing context value')
  }

  return context
}
