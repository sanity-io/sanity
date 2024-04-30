/**
 * This is a _FALLBACK MODULE_ provided for backwards compatibility, and is likely to be removed
 * in Sanity v4.0.0. Please import from `sanity/structure` instead.
 *
 * @deprecated Use `sanity/structure` instead.
 */
import {
  type BackLinkProps as _BackLinkProps,
  type BaseGenericList as _BaseGenericList,
  type BaseIntentParams as _BaseIntentParams,
  type BaseView as _BaseView,
  type BuildableComponent as _BuildableComponent,
  type BuildableGenericList as _BuildableGenericList,
  type BuildableList as _BuildableList,
  type Builder as _Builder,
  type Child as _Child,
  type ChildLinkProps as _ChildLinkProps,
  type ChildObservable as _ChildObservable,
  type ChildResolver as _ChildResolver,
  type ChildResolverOptions as _ChildResolverOptions,
  type Collection as _Collection,
  type CollectionBuilder as _CollectionBuilder,
  type Component as _Component,
  component as _component,
  ComponentBuilder as _ComponentBuilder,
  type ComponentInput as _ComponentInput,
  type ComponentView as _ComponentView,
  ComponentViewBuilder as _ComponentViewBuilder,
  ConfirmDeleteDialog as _ConfirmDeleteDialog,
  type ConfirmDeleteDialogProps as _ConfirmDeleteDialogProps,
  createStructureBuilder as _createStructureBuilder,
  type CustomComponentPaneNode as _CustomComponentPaneNode,
  DEFAULT_INTENT_HANDLER as _DEFAULT_INTENT_HANDLER,
  type DefaultDocumentNodeContext as _DefaultDocumentNodeContext,
  type DefaultDocumentNodeResolver as _DefaultDocumentNodeResolver,
  defaultInitialValueTemplateItems as _defaultInitialValueTemplateItems,
  defaultIntentChecker as _defaultIntentChecker,
  type Divider as _Divider,
  DocumentBuilder as _DocumentBuilder,
  type DocumentFieldMenuActionNode as _DocumentFieldMenuActionNode,
  documentFromEditor as _documentFromEditor,
  documentFromEditorWithInitialValue as _documentFromEditorWithInitialValue,
  DocumentInspectorHeader as _DocumentInspectorHeader,
  type DocumentList as _DocumentList,
  DocumentListBuilder as _DocumentListBuilder,
  type DocumentListInput as _DocumentListInput,
  type DocumentListItem as _DocumentListItem,
  DocumentListItemBuilder as _DocumentListItemBuilder,
  type DocumentListItemInput as _DocumentListItemInput,
  type DocumentListOptions as _DocumentListOptions,
  DocumentListPane as _DocumentListPane,
  type DocumentListPaneNode as _DocumentListPaneNode,
  type DocumentListPaneProps as _DocumentListPaneProps,
  type DocumentNode as _DocumentNode,
  type DocumentOptions as _DocumentOptions,
  DocumentPane as _DocumentPane,
  type DocumentPaneNode as _DocumentPaneNode,
  DocumentPaneProvider as _DocumentPaneProvider,
  type DocumentPaneProviderProps as _DocumentPaneProviderProps,
  DocumentTypeListBuilder as _DocumentTypeListBuilder,
  type DocumentTypeListInput as _DocumentTypeListInput,
  type EditorNode as _EditorNode,
  type EditReferenceOptions as _EditReferenceOptions,
  form as _form,
  type FormView as _FormView,
  FormViewBuilder as _FormViewBuilder,
  type GenericList as _GenericList,
  GenericListBuilder as _GenericListBuilder,
  type GenericListInput as _GenericListInput,
  GenericViewBuilder as _GenericViewBuilder,
  getOrderingMenuItem as _getOrderingMenuItem,
  getOrderingMenuItemsForSchemaType as _getOrderingMenuItemsForSchemaType,
  getTypeNamesFromFilter as _getTypeNamesFromFilter,
  HELP_URL as _HELP_URL,
  InitialValueTemplateItemBuilder as _InitialValueTemplateItemBuilder,
  type Intent as _Intent,
  type IntentChecker as _IntentChecker,
  type IntentJsonParams as _IntentJsonParams,
  type IntentParams as _IntentParams,
  isDocumentListItem as _isDocumentListItem,
  type ItemChild as _ItemChild,
  type List as _List,
  ListBuilder as _ListBuilder,
  type ListDisplayOptions as _ListDisplayOptions,
  type ListInput as _ListInput,
  type ListItem as _ListItem,
  ListItemBuilder as _ListItemBuilder,
  type ListItemChild as _ListItemChild,
  type ListItemDisplayOptions as _ListItemDisplayOptions,
  type ListItemInput as _ListItemInput,
  type ListItemSerializeOptions as _ListItemSerializeOptions,
  type ListPaneNode as _ListPaneNode,
  maybeSerializeInitialValueTemplateItem as _maybeSerializeInitialValueTemplateItem,
  maybeSerializeMenuItem as _maybeSerializeMenuItem,
  maybeSerializeMenuItemGroup as _maybeSerializeMenuItemGroup,
  maybeSerializeView as _maybeSerializeView,
  type MenuItem as _MenuItem,
  type MenuItemActionType as _MenuItemActionType,
  MenuItemBuilder as _MenuItemBuilder,
  type MenuItemGroup as _MenuItemGroup,
  MenuItemGroupBuilder as _MenuItemGroupBuilder,
  type MenuItemParamsType as _MenuItemParamsType,
  menuItemsFromInitialValueTemplateItems as _menuItemsFromInitialValueTemplateItems,
  PaneLayout as _PaneLayout,
  type PaneListItem as _PaneListItem,
  type PaneListItemDivider as _PaneListItemDivider,
  type PaneMenuItem as _PaneMenuItem,
  type PaneMenuItemGroup as _PaneMenuItemGroup,
  type PaneNode as _PaneNode,
  type PaneNodeResolver as _PaneNodeResolver,
  type PaneRouterContextValue as _PaneRouterContextValue,
  type ParameterizedLinkProps as _ParameterizedLinkProps,
  type PartialDocumentList as _PartialDocumentList,
  type PartialDocumentListItem as _PartialDocumentListItem,
  type PartialDocumentNode as _PartialDocumentNode,
  type PartialListItem as _PartialListItem,
  type PartialMenuItem as _PartialMenuItem,
  type ReferenceChildLinkProps as _ReferenceChildLinkProps,
  type RouterPaneGroup as _RouterPaneGroup,
  type RouterPanes as _RouterPanes,
  type RouterPaneSibling as _RouterPaneSibling,
  type RouterPaneSiblingContext as _RouterPaneSiblingContext,
  type SerializablePaneNode as _SerializablePaneNode,
  SerializeError as _SerializeError,
  type SerializeOptions as _SerializeOptions,
  type SerializePath as _SerializePath,
  shallowIntentChecker as _shallowIntentChecker,
  type SortMenuItem as _SortMenuItem,
  type StructureBuilder as _StructureBuilder,
  type StructureBuilderOptions as _StructureBuilderOptions,
  type StructureContext as _StructureContext,
  structureLocaleNamespace as _structureLocaleNamespace,
  type StructureLocaleResourceKeys as _StructureLocaleResourceKeys,
  type StructureNode as _StructureNode,
  type StructureResolver as _StructureResolver,
  type StructureResolverContext as _StructureResolverContext,
  structureTool as _structureTool,
  type StructureToolContextValue as _DeskToolContextValue,
  type StructureToolFeatures as _DeskToolFeatures,
  type StructureToolMenuItem as _DeskToolMenuItem,
  type StructureToolOptions as _DeskToolOptions,
  type StructureToolPaneActionHandler as _DeskToolPaneActionHandler,
  StructureToolProvider as _DeskToolProvider,
  type StructureToolProviderProps as _DeskToolProviderProps,
  type UnresolvedPaneNode as _UnresolvedPaneNode,
  type UnserializedListItem as _UnserializedListItem,
  type UnserializedListItemChild as _UnserializedListItemChild,
  useDocumentPane as _useDocumentPane,
  useDocumentTitle as _useDocumentTitle,
  usePaneRouter as _usePaneRouter,
  type UserComponent as _UserComponent,
  type UserViewComponent as _UserViewComponent,
  useStructureTool as _useStructureTool,
  type View as _View,
  type ViewBuilder as _ViewBuilder,
} from '../structure'

/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BackLinkProps = _BackLinkProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseGenericList = _BaseGenericList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseIntentParams = _BaseIntentParams
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type {BaseResolvedPaneNode} from '../structure'
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseView = _BaseView
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableComponent = _BuildableComponent
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableGenericList = _BuildableGenericList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableList = _BuildableList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Builder = _Builder
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Child = _Child
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildLinkProps = _ChildLinkProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildObservable = _ChildObservable
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildResolver = _ChildResolver
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildResolverOptions = _ChildResolverOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Collection = _Collection
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type CollectionBuilder = _CollectionBuilder
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Component = _Component
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ComponentInput = _ComponentInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ComponentView = _ComponentView
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ConfirmDeleteDialogProps = _ConfirmDeleteDialogProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type CustomComponentPaneNode = _CustomComponentPaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DefaultDocumentNodeContext = _DefaultDocumentNodeContext
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DefaultDocumentNodeResolver = _DefaultDocumentNodeResolver
/**
 * @deprecated Import `StructureToolContextValue` from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolContextValue = _DeskToolContextValue
/**
 * @deprecated Import `StructureToolFeatures` from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolFeatures = _DeskToolFeatures
/**
 * @deprecated Import `StructureToolMenuItem` from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolMenuItem = _DeskToolMenuItem
/**
 * @deprecated Import `StructureToolOptions` from `sanity/structure` instead
 * @hidden
 * @public
 */
export type DeskToolOptions = _DeskToolOptions
/**
 * @deprecated Import `StructureToolPaneActionHandler` from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolPaneActionHandler = _DeskToolPaneActionHandler
/**
 * @deprecated Import `StructureToolProviderProps` from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolProviderProps = _DeskToolProviderProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Divider = _Divider
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentFieldMenuActionNode = _DocumentFieldMenuActionNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentList = _DocumentList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListInput = _DocumentListInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListItem = _DocumentListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListItemInput = _DocumentListItemInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListOptions = _DocumentListOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListPaneNode = _DocumentListPaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListPaneProps = _DocumentListPaneProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentNode = _DocumentNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentOptions = _DocumentOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentPaneNode = _DocumentPaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentPaneProviderProps = _DocumentPaneProviderProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentTypeListInput = _DocumentTypeListInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type EditReferenceOptions = _EditReferenceOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type EditorNode = _EditorNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type FormView = _FormView
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type GenericList = _GenericList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type GenericListInput = _GenericListInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type Intent = _Intent
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentChecker = _IntentChecker
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentJsonParams = _IntentJsonParams
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentParams = _IntentParams
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ItemChild = _ItemChild
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type List = _List
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListDisplayOptions = _ListDisplayOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListInput = _ListInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItem = _ListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemChild = _ListItemChild
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemDisplayOptions = _ListItemDisplayOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemInput = _ListItemInput
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemSerializeOptions = _ListItemSerializeOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListPaneNode = _ListPaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItem = _MenuItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemActionType = _MenuItemActionType
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemGroup = _MenuItemGroup
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemParamsType = _MenuItemParamsType
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneListItem = _PaneListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneListItemDivider = _PaneListItemDivider
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneMenuItem = _PaneMenuItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneMenuItemGroup = _PaneMenuItemGroup
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneNode = _PaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneNodeResolver = _PaneNodeResolver
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneRouterContextValue = _PaneRouterContextValue
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ParameterizedLinkProps = _ParameterizedLinkProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentList = _PartialDocumentList
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentListItem = _PartialDocumentListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentNode = _PartialDocumentNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialListItem = _PartialListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialMenuItem = _PartialMenuItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ReferenceChildLinkProps = _ReferenceChildLinkProps
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneGroup = _RouterPaneGroup
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneSibling = _RouterPaneSibling
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneSiblingContext = _RouterPaneSiblingContext
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPanes = _RouterPanes
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type {Serializable} from '../structure'
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializablePaneNode = _SerializablePaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializeOptions = _SerializeOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializePath = _SerializePath
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type SortMenuItem = _SortMenuItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureBuilder = _StructureBuilder
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureBuilderOptions = _StructureBuilderOptions
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureContext = _StructureContext
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureLocaleResourceKeys = _StructureLocaleResourceKeys
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureNode = _StructureNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureResolver = _StructureResolver
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureResolverContext = _StructureResolverContext
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnresolvedPaneNode = _UnresolvedPaneNode
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnserializedListItem = _UnserializedListItem
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnserializedListItemChild = _UnserializedListItemChild
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type UserComponent = _UserComponent
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type UserViewComponent = _UserViewComponent
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type View = _View
/**
 * @deprecated Import from `sanity/structure` instead
 * @hidden
 * @beta
 */
export type ViewBuilder = _ViewBuilder

/** --------- NON-TYPES FOLLOW --------- */

/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const ComponentBuilder = _ComponentBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const ComponentViewBuilder = _ComponentViewBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const ConfirmDeleteDialog = _ConfirmDeleteDialog
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DEFAULT_INTENT_HANDLER = _DEFAULT_INTENT_HANDLER
/**
 * @deprecated Import `StructureToolProvider` from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DeskToolProvider = _DeskToolProvider
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentBuilder = _DocumentBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentInspectorHeader = _DocumentInspectorHeader
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentListBuilder = _DocumentListBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentListItemBuilder = _DocumentListItemBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentListPane = _DocumentListPane
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentPane = _DocumentPane
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentPaneProvider = _DocumentPaneProvider
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const DocumentTypeListBuilder = _DocumentTypeListBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const FormViewBuilder = _FormViewBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const GenericListBuilder = _GenericListBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const GenericViewBuilder = _GenericViewBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const HELP_URL = _HELP_URL
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const InitialValueTemplateItemBuilder = _InitialValueTemplateItemBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const ListBuilder = _ListBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const ListItemBuilder = _ListItemBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const MenuItemBuilder = _MenuItemBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const MenuItemGroupBuilder = _MenuItemGroupBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const PaneLayout = _PaneLayout

/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const SerializeError = _SerializeError
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const component = _component
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const createStructureBuilder = _createStructureBuilder
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const defaultInitialValueTemplateItems = _defaultInitialValueTemplateItems
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const defaultIntentChecker = _defaultIntentChecker
/**
 * @deprecated Import `structureTool` from `sanity/structure` instead!
 * @hidden
 * @public
 */
export const deskTool = _structureTool
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const documentFromEditor = _documentFromEditor
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const documentFromEditorWithInitialValue = _documentFromEditorWithInitialValue
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const form = _form
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const getOrderingMenuItem = _getOrderingMenuItem
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const getOrderingMenuItemsForSchemaType = _getOrderingMenuItemsForSchemaType
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const getTypeNamesFromFilter = _getTypeNamesFromFilter
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const isDocumentListItem = _isDocumentListItem
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const maybeSerializeInitialValueTemplateItem = _maybeSerializeInitialValueTemplateItem
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const maybeSerializeMenuItem = _maybeSerializeMenuItem
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const maybeSerializeMenuItemGroup = _maybeSerializeMenuItemGroup
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const maybeSerializeView = _maybeSerializeView
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const menuItemsFromInitialValueTemplateItems = _menuItemsFromInitialValueTemplateItems
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const shallowIntentChecker = _shallowIntentChecker
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const structureLocaleNamespace = _structureLocaleNamespace
/**
 * @deprecated Import `useStructureTool` from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const useDeskTool = _useStructureTool
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const useDocumentPane = _useDocumentPane
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const useDocumentTitle = _useDocumentTitle
/**
 * @deprecated Import from `sanity/structure` instead!
 * @hidden
 * @beta
 */
export const usePaneRouter = _usePaneRouter
