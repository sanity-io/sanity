/**
 * Private internals of `sanity/structure` that do not follow semver.
 *
 * Everything exported from this entry is tagged `@internal`, `@hidden` or `@deprecated`: it is
 * exported because the Studio's own tools and plugins need it, not because it is meant to be used
 * by studios or third-party plugins. Every export can change or disappear in any release,
 * including patch releases, without notice, without a deprecation period and without being
 * mentioned in the changelog. The contract of
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` applies here too.
 *
 * The Structure Builder classes are the exception to the tags: their types are public API on
 * `sanity/structure`, which exports them type-only, so `S.document()` and the other builder methods
 * keep their return types. Their runtime values (`new DocumentBuilder()`, `instanceof`, `extends`)
 * are only exported here, under the same no-semver contract.
 */

export {type ConfirmDeleteDialogProps} from '../structure/components/confirmDeleteDialog/ConfirmDeleteDialog'
export {PaneLayout} from '../structure/components/pane/PaneLayout'
export {
  type BackLinkProps,
  type ChildLinkProps,
  type PaneRouterContextValue,
  type ParameterizedLinkProps,
  type ReferenceChildLinkProps,
} from '../structure/components/paneRouter/types'
export {usePaneRouter} from '../structure/components/paneRouter/usePaneRouter'
export {DocumentInspectorHeader} from '../structure/panes/document/documentInspector/DocumentInspectorHeader'
export {DocumentPaneProviderWrapper as DocumentPaneProvider} from '../structure/panes/document/DocumentPaneProviderWrapper'
export {type DocumentPaneProviderProps} from '../structure/panes/document/types'
export {useDocumentTitle, type UseDocumentTitle} from '../structure/panes/document/useDocumentTitle'
export {type DocumentListPaneProps} from '../structure/panes/documentList'
export {ComponentBuilder} from '../structure/structureBuilder/Component'
export {type StructureBuilderOptions} from '../structure/structureBuilder/createStructureBuilder'
export {DocumentBuilder} from '../structure/structureBuilder/Document'
export {DocumentListBuilder} from '../structure/structureBuilder/DocumentList'
export {DocumentListItemBuilder} from '../structure/structureBuilder/DocumentListItem'
export {DocumentTypeListBuilder} from '../structure/structureBuilder/DocumentTypeList'
export {GenericListBuilder} from '../structure/structureBuilder/GenericList'
export {InitialValueTemplateItemBuilder} from '../structure/structureBuilder/InitialValueTemplateItem'
export {ListBuilder} from '../structure/structureBuilder/List'
export {ListItemBuilder} from '../structure/structureBuilder/ListItem'
export {MenuItemBuilder, type SortMenuItem} from '../structure/structureBuilder/MenuItem'
export {MenuItemGroupBuilder} from '../structure/structureBuilder/MenuItemGroup'
export {type Builder} from '../structure/structureBuilder/StructureNodes'
export {ComponentViewBuilder} from '../structure/structureBuilder/views/ComponentView'
export {FormViewBuilder} from '../structure/structureBuilder/views/FormView'
export {GenericViewBuilder} from '../structure/structureBuilder/views/View'
export {
  type BaseResolvedPaneNode,
  type CustomComponentPaneNode,
  type DocumentFieldMenuActionNode,
  type DocumentListPaneNode,
  type DocumentPaneNode,
  type ListPaneNode,
  type PaneListItem,
  type PaneListItemDivider,
  type PaneMenuItem,
  type PaneMenuItemGroup,
  type PaneNode,
  type PaneNodeResolver,
  type RouterPaneGroup,
  type RouterPanes,
  type RouterPaneSibling,
  type RouterPaneSiblingContext,
  type SerializablePaneNode,
  type StructureResolverContext,
  type StructureToolContextValue,
  type StructureToolFeatures,
  type StructureToolPaneActionHandler,
  type UnresolvedPaneNode,
} from '../structure/types'
