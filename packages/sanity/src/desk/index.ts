export * from './deskTool'

export {DocumentInspectorHeader} from './panes/document/documentInspector'

// Export `DocumentPaneProvider`
export {type DocumentPaneProviderProps} from './panes/document/types'
export * from './panes/document/DocumentPaneProvider'

export * from './panes/document/useDocumentPane'

export * from './types'

export * from './DeskToolProvider'

export {ConfirmDeleteDialog, usePaneRouter} from './components'

export type {ConfirmDeleteDialogProps} from './components'

export type {
  BackLinkProps,
  ChildLinkProps,
  EditReferenceOptions,
  PaneRouterContextValue,
  ParameterizedLinkProps,
  ReferenceChildLinkProps,
} from './components'

export * from './structureBuilder'

export * from './useDeskTool'
