/**
 * These are provided from `sanity/structure` for backwards compatibility;
 * `@sanity/presentation` depends/depended on them from `sanity/structure` originially.
 *
 * Do not remove until next major version at the earliest (eg v4)
 */
import {
  type CommentIntentGetter as _CommentIntentGetter,
  CommentsIntentProvider as _CommentsIntentProvider,
} from 'sanity'

/**
 * @deprecated Import from `sanity` instead of `sanity/structure`
 * @internal
 */
export type CommentIntentGetter = _CommentIntentGetter

/**
 * @deprecated Import from `sanity` instead of `sanity/structure`
 * @internal
 */
export const CommentsIntentProvider = _CommentsIntentProvider

export type {
  BackLinkProps,
  ChildLinkProps,
  ConfirmDeleteDialogProps,
  EditReferenceOptions,
  PaneRouterContextValue,
  ParameterizedLinkProps,
  ReferenceChildLinkProps,
} from './components'
export {
  ConfirmDeleteDialog,
  Pane,
  PaneContent,
  PaneLayout,
  PaneRouterContext,
  usePaneRouter,
} from './components'
export {structureLocaleNamespace, type StructureLocaleResourceKeys} from './i18n'
export * from './panes/document'
export {DocumentInspectorHeader} from './panes/document/documentInspector'
export {type DocumentPaneProviderProps} from './panes/document/types'
export * from './panes/document/useDocumentPane'
export * from './panes/documentList'
export * from './structureBuilder'
export * from './structureTool'
export * from './StructureToolProvider'
export * from './types'
export * from './useStructureTool'
