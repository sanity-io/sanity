export * from './structureTool'

export {DocumentInspectorHeader} from './panes/document/documentInspector'

// Export `DocumentPaneProvider`
export {type DocumentPaneProviderProps} from './panes/document/types'

export * from './panes/document/useDocumentPane'

export * from './types'

export * from './StructureToolProvider'

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

export * from './useStructureTool'

export * from './panes/document'

export * from './panes/documentList'

export {structureLocaleNamespace, type StructureLocaleResourceKeys} from './i18n'
