export {defineIncomingReferenceDecoration} from '../structure/components/incomingReferencesDecoration/defineIncomingReferenceDecoration'
export {isIncomingReferenceCreation} from '../structure/components/incomingReferencesDecoration/isIncomingReferenceCreation'
export {
  type IncomingReferenceAction,
  type IncomingReferencesOptions,
} from '../structure/components/incomingReferencesDecoration/types'
export {structureLocaleNamespace} from '../structure/i18n'
export {type StructureLocaleResourceKeys} from '../structure/i18n/resources'
export {
  type ChildObservable,
  type ChildResolver,
  type ChildResolverOptions,
  type ItemChild,
} from '../structure/structureBuilder/ChildResolver'
export {
  type BuildableComponent,
  type Component,
  type ComponentBuilder,
  type ComponentInput,
} from '../structure/structureBuilder/Component'
export {
  type DocumentBuilder,
  type PartialDocumentNode,
} from '../structure/structureBuilder/Document'
export {
  type DocumentList,
  type DocumentListBuilder,
  type DocumentListInput,
  type DocumentListOptions,
  type PartialDocumentList,
} from '../structure/structureBuilder/DocumentList'
export {
  type DocumentListItem,
  type DocumentListItemBuilder,
  type DocumentListItemInput,
  type PartialDocumentListItem,
} from '../structure/structureBuilder/DocumentListItem'
export {
  type DocumentTypeListBuilder,
  type DocumentTypeListInput,
} from '../structure/structureBuilder/DocumentTypeList'
export {
  type BaseGenericList,
  type BuildableGenericList,
  type GenericList,
  type GenericListBuilder,
  type GenericListInput,
  type ListDisplayOptions,
} from '../structure/structureBuilder/GenericList'
export {type InitialValueTemplateItemBuilder} from '../structure/structureBuilder/InitialValueTemplateItem'
export {
  type Intent,
  type IntentChecker,
  type IntentParams,
} from '../structure/structureBuilder/Intent'
export {
  type BuildableList,
  type List,
  type ListBuilder,
  type ListInput,
  type SingletonListBuilder,
} from '../structure/structureBuilder/List'
export {
  type ListItem,
  type ListItemBuilder,
  type ListItemChild,
  type ListItemCount,
  type ListItemDisplayOptions,
  type ListItemInput,
  type ListItemSerializeOptions,
  type PartialListItem,
  type UnserializedListItem,
  type UnserializedListItemChild,
} from '../structure/structureBuilder/ListItem'
export {
  type KnownMenuItemParams,
  type MenuItem,
  type MenuItemActionType,
  type MenuItemBuilder,
  type MenuItemParamsType,
  type PartialMenuItem,
  type MenuItem as StructureToolMenuItem,
} from '../structure/structureBuilder/MenuItem'
export {
  type MenuItemGroup,
  type MenuItemGroupBuilder,
} from '../structure/structureBuilder/MenuItemGroup'
export {
  type Child,
  type Collection,
  type CollectionBuilder,
  type Divider,
  type DocumentNode,
  type EditorNode,
  type Serializable,
  type SerializeOptions,
  type SerializePath,
  type StructureNode,
} from '../structure/structureBuilder/StructureNodes'
export {
  type DefaultDocumentNodeContext,
  type DefaultDocumentNodeResolver,
  type StructureBuilder,
  type StructureContext,
  type UserComponent,
  type UserViewComponent,
  type View,
} from '../structure/structureBuilder/types'
export {
  type ComponentView,
  type ComponentViewBuilder,
} from '../structure/structureBuilder/views/ComponentView'
export {type FormView, type FormViewBuilder} from '../structure/structureBuilder/views/FormView'
export {
  type BaseView,
  type GenericViewBuilder,
  type ViewBuilder,
} from '../structure/structureBuilder/views/View'
export {structureTool} from '../structure/structureTool'
export {type StructureResolver, type StructureToolOptions} from '../structure/types'

export {type EditReferenceOptions} from '../structure/components/paneRouter/types'
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
export {type DocumentPaneProviderProps} from '../structure/panes/document/types'
export {
  ConfirmDeleteDialog,
  DocumentListPane,
  DocumentPane,
  DocumentPaneProvider,
} from '../structure/publicLazy'
export {useDocumentPane} from '../structure/panes/document/useDocumentPane'
export {useDocumentTitle, type UseDocumentTitle} from '../structure/panes/document/useDocumentTitle'
export {type DocumentListPaneProps} from '../structure/panes/documentList'
export {
  type StructureBuilderOptions,
  createStructureBuilder,
} from '../structure/structureBuilder/createStructureBuilder'
export {
  documentFromEditor,
  documentFromEditorWithInitialValue,
} from '../structure/structureBuilder/Document'
export {getTypeNamesFromFilter} from '../structure/structureBuilder/DocumentList'
export {isDocumentListItem} from '../structure/structureBuilder/DocumentListItem'
export {shallowIntentChecker} from '../structure/structureBuilder/GenericList'
export {
  defaultInitialValueTemplateItems,
  maybeSerializeInitialValueTemplateItem,
  menuItemsFromInitialValueTemplateItems,
} from '../structure/structureBuilder/InitialValueTemplateItem'
export {DEFAULT_INTENT_HANDLER, defaultIntentChecker} from '../structure/structureBuilder/Intent'
export {
  type SortMenuItem,
  getOrderingMenuItem,
  getOrderingMenuItemsForSchemaType,
  maybeSerializeMenuItem,
} from '../structure/structureBuilder/MenuItem'
export {maybeSerializeMenuItemGroup} from '../structure/structureBuilder/MenuItemGroup'
export {HELP_URL, SerializeError} from '../structure/structureBuilder/SerializeError'
export {type Builder} from '../structure/structureBuilder/StructureNodes'
export {component, form} from '../structure/structureBuilder/views'
export {maybeSerializeView} from '../structure/structureBuilder/views/View'
export {
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
  type UnresolvedPaneNode,
} from '../structure/types'

// <tombstones>
// Generated by tombstones/generate.mjs from tombstones/manifest.json — do not edit by hand.
// Type-only: every symbol is `export declare` / `export type … = never`. Nothing here may
// emit runtime JavaScript. See AGENTS.md ("Export tombstones (v7)").
/**
 * @deprecated Moved to `sanity/router`. Import `{BaseIntentParams}` from `sanity/router` instead of `sanity/structure`.
 */
export type BaseIntentParams = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type BaseResolvedPaneNode = never
/**
 * @deprecated Moved to `sanity`. Import `{DocumentOptions}` from `sanity` instead of `sanity/structure`.
 */
export type DocumentOptions = never
/**
 * @deprecated Moved to `sanity/router`. Import `{IntentJsonParams}` from `sanity/router` instead of `sanity/structure`.
 */
export type IntentJsonParams = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ORDER_BY_IDS_PARAM_FIELD: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const Pane: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const PaneContent: never
/**
 * @deprecated Moved to `sanity/_singletons`. Import `{PaneRouterContext}` from `sanity/_singletons` instead of `sanity/structure`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PaneRouterContext: never
/**
 * @deprecated Moved to `sanity`. Import `{StrictVersionLayeringOptions}` from `sanity` instead of `sanity/structure`.
 */
export type StrictVersionLayeringOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolFeatures = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolPaneActionHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const StructureToolProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import `{StructureToolProviderProps}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2` instead of `sanity/structure`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const usePaneOptions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useStructureTool: never
// </tombstones>
