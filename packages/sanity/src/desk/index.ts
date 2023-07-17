export * from './deskTool'

export {DocumentInspectorHeader} from './panes/document/documentInspector'

// Export `DocumentPaneProvider`
export {type DocumentPaneProviderProps} from './panes/document/types'

export * from './panes/document/useDocumentPane'

export * from './types'

export * from './DeskToolProvider'

export {ConfirmDeleteDialog, PaneLayout, PaneRouterContext, usePaneRouter} from './components'

export type {
  BackLinkProps,
  ChildLinkProps,
  ConfirmDeleteDialogProps,
  EditReferenceOptions,
  PaneRouterContextValue,
  ParameterizedLinkProps,
  ReferenceChildLinkProps,
} from './components'

export * from './structureBuilder'

export * from './useDeskTool'

export * from './panes/document'

export * from './panes/documentList'

export {deskLocaleNamespace, type DeskLocaleResourceKeys} from './i18n'
