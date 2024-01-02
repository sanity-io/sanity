/**
 * This is a _FALLBACK MODULE_ provided for backwards compatibility, and is likely to be removed
 * in Sanity v4.0.0. Please import from `@sanity/structure` instead.
 *
 * @deprecated Use `@sanity/structure` instead.
 */
import type {
  BackLinkProps as _BackLinkProps,
  BaseGenericList as _BaseGenericList,
  BaseIntentParams as _BaseIntentParams,
  BaseView as _BaseView,
  BuildableComponent as _BuildableComponent,
  BuildableGenericList as _BuildableGenericList,
  BuildableList as _BuildableList,
  Builder as _Builder,
  Child as _Child,
  ChildLinkProps as _ChildLinkProps,
  ChildObservable as _ChildObservable,
  ChildResolver as _ChildResolver,
  ChildResolverOptions as _ChildResolverOptions,
  Collection as _Collection,
  CollectionBuilder as _CollectionBuilder,
  Component as _Component,
  ComponentInput as _ComponentInput,
  ComponentView as _ComponentView,
  ConfirmDeleteDialogProps as _ConfirmDeleteDialogProps,
  CustomComponentPaneNode as _CustomComponentPaneNode,
  DefaultDocumentNodeContext as _DefaultDocumentNodeContext,
  DefaultDocumentNodeResolver as _DefaultDocumentNodeResolver,
  Divider as _Divider,
  DocumentFieldMenuActionNode as _DocumentFieldMenuActionNode,
  DocumentList as _DocumentList,
  DocumentListInput as _DocumentListInput,
  DocumentListItem as _DocumentListItem,
  DocumentListItemInput as _DocumentListItemInput,
  DocumentListOptions as _DocumentListOptions,
  DocumentListPaneNode as _DocumentListPaneNode,
  DocumentListPaneProps as _DocumentListPaneProps,
  DocumentNode as _DocumentNode,
  DocumentOptions as _DocumentOptions,
  DocumentPaneNode as _DocumentPaneNode,
  DocumentPaneProviderProps as _DocumentPaneProviderProps,
  DocumentTypeListInput as _DocumentTypeListInput,
  EditReferenceOptions as _EditReferenceOptions,
  EditorNode as _EditorNode,
  FormView as _FormView,
  GenericList as _GenericList,
  GenericListInput as _GenericListInput,
  Intent as _Intent,
  IntentChecker as _IntentChecker,
  IntentJsonParams as _IntentJsonParams,
  IntentParams as _IntentParams,
  ItemChild as _ItemChild,
  List as _List,
  ListDisplayOptions as _ListDisplayOptions,
  ListInput as _ListInput,
  ListItem as _ListItem,
  ListItemChild as _ListItemChild,
  ListItemDisplayOptions as _ListItemDisplayOptions,
  ListItemInput as _ListItemInput,
  ListItemSerializeOptions as _ListItemSerializeOptions,
  ListPaneNode as _ListPaneNode,
  MenuItem as _MenuItem,
  MenuItemActionType as _MenuItemActionType,
  MenuItemGroup as _MenuItemGroup,
  MenuItemParamsType as _MenuItemParamsType,
  PaneListItem as _PaneListItem,
  PaneListItemDivider as _PaneListItemDivider,
  PaneMenuItem as _PaneMenuItem,
  PaneMenuItemGroup as _PaneMenuItemGroup,
  PaneNode as _PaneNode,
  PaneNodeResolver as _PaneNodeResolver,
  PaneRouterContextValue as _PaneRouterContextValue,
  ParameterizedLinkProps as _ParameterizedLinkProps,
  PartialDocumentList as _PartialDocumentList,
  PartialDocumentListItem as _PartialDocumentListItem,
  PartialDocumentNode as _PartialDocumentNode,
  PartialListItem as _PartialListItem,
  PartialMenuItem as _PartialMenuItem,
  ReferenceChildLinkProps as _ReferenceChildLinkProps,
  RouterPaneGroup as _RouterPaneGroup,
  RouterPaneSibling as _RouterPaneSibling,
  RouterPaneSiblingContext as _RouterPaneSiblingContext,
  RouterPanes as _RouterPanes,
  SerializablePaneNode as _SerializablePaneNode,
  SerializeOptions as _SerializeOptions,
  SerializePath as _SerializePath,
  SortMenuItem as _SortMenuItem,
  StructureBuilder as _StructureBuilder,
  StructureBuilderOptions as _StructureBuilderOptions,
  StructureContext as _StructureContext,
  StructureLocaleResourceKeys as _StructureLocaleResourceKeys,
  StructureNode as _StructureNode,
  StructureResolver as _StructureResolver,
  StructureResolverContext as _StructureResolverContext,
  StructureToolContextValue as _DeskToolContextValue,
  StructureToolFeatures as _DeskToolFeatures,
  StructureToolMenuItem as _DeskToolMenuItem,
  StructureToolOptions as _DeskToolOptions,
  StructureToolPaneActionHandler as _DeskToolPaneActionHandler,
  StructureToolProviderProps as _DeskToolProviderProps,
  UnresolvedPaneNode as _UnresolvedPaneNode,
  UnserializedListItem as _UnserializedListItem,
  UnserializedListItemChild as _UnserializedListItemChild,
  UserComponent as _UserComponent,
  UserViewComponent as _UserViewComponent,
  View as _View,
  ViewBuilder as _ViewBuilder,
} from '../structure'

import {
  ComponentBuilder as _ComponentBuilder,
  ComponentViewBuilder as _ComponentViewBuilder,
  ConfirmDeleteDialog as _ConfirmDeleteDialog,
  DEFAULT_INTENT_HANDLER as _DEFAULT_INTENT_HANDLER,
  StructureToolProvider as _DeskToolProvider,
  DocumentBuilder as _DocumentBuilder,
  DocumentInspectorHeader as _DocumentInspectorHeader,
  DocumentListBuilder as _DocumentListBuilder,
  DocumentListItemBuilder as _DocumentListItemBuilder,
  DocumentListPane as _DocumentListPane,
  DocumentPane as _DocumentPane,
  DocumentPaneProvider as _DocumentPaneProvider,
  DocumentTypeListBuilder as _DocumentTypeListBuilder,
  FormViewBuilder as _FormViewBuilder,
  GenericListBuilder as _GenericListBuilder,
  GenericViewBuilder as _GenericViewBuilder,
  HELP_URL as _HELP_URL,
  InitialValueTemplateItemBuilder as _InitialValueTemplateItemBuilder,
  ListBuilder as _ListBuilder,
  ListItemBuilder as _ListItemBuilder,
  MenuItemBuilder as _MenuItemBuilder,
  MenuItemGroupBuilder as _MenuItemGroupBuilder,
  PaneLayout as _PaneLayout,
  PaneRouterContext as _PaneRouterContext,
  SerializeError as _SerializeError,
  component as _component,
  createStructureBuilder as _createStructureBuilder,
  defaultInitialValueTemplateItems as _defaultInitialValueTemplateItems,
  defaultIntentChecker as _defaultIntentChecker,
  documentFromEditor as _documentFromEditor,
  documentFromEditorWithInitialValue as _documentFromEditorWithInitialValue,
  form as _form,
  getOrderingMenuItem as _getOrderingMenuItem,
  getOrderingMenuItemsForSchemaType as _getOrderingMenuItemsForSchemaType,
  getTypeNamesFromFilter as _getTypeNamesFromFilter,
  isDocumentListItem as _isDocumentListItem,
  maybeSerializeInitialValueTemplateItem as _maybeSerializeInitialValueTemplateItem,
  maybeSerializeMenuItem as _maybeSerializeMenuItem,
  maybeSerializeMenuItemGroup as _maybeSerializeMenuItemGroup,
  maybeSerializeView as _maybeSerializeView,
  menuItemsFromInitialValueTemplateItems as _menuItemsFromInitialValueTemplateItems,
  shallowIntentChecker as _shallowIntentChecker,
  structureLocaleNamespace as _structureLocaleNamespace,
  structureTool as _structureTool,
  useStructureTool as _useStructureTool,
  useDocumentPane as _useDocumentPane,
  useDocumentTitle as _useDocumentTitle,
  usePaneRouter as _usePaneRouter,
} from '../structure'

/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BackLinkProps = _BackLinkProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseGenericList = _BaseGenericList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseIntentParams = _BaseIntentParams
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type {BaseResolvedPaneNode} from '../structure'
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BaseView = _BaseView
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableComponent = _BuildableComponent
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableGenericList = _BuildableGenericList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type BuildableList = _BuildableList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Builder = _Builder
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Child = _Child
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildLinkProps = _ChildLinkProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildObservable = _ChildObservable
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildResolver = _ChildResolver
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ChildResolverOptions = _ChildResolverOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Collection = _Collection
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type CollectionBuilder = _CollectionBuilder
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Component = _Component
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ComponentInput = _ComponentInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ComponentView = _ComponentView
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ConfirmDeleteDialogProps = _ConfirmDeleteDialogProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type CustomComponentPaneNode = _CustomComponentPaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DefaultDocumentNodeContext = _DefaultDocumentNodeContext
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DefaultDocumentNodeResolver = _DefaultDocumentNodeResolver
/**
 * @deprecated Import `StructureToolContextValue` from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolContextValue = _DeskToolContextValue
/**
 * @deprecated Import `StructureToolFeatures` from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolFeatures = _DeskToolFeatures
/**
 * @deprecated Import `StructureToolMenuItem` from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolMenuItem = _DeskToolMenuItem
/**
 * @deprecated Import `StructureToolOptions` from `@sanity/structure` instead
 * @hidden
 * @public
 */
export type DeskToolOptions = _DeskToolOptions
/**
 * @deprecated Import `StructureToolPaneActionHandler` from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolPaneActionHandler = _DeskToolPaneActionHandler
/**
 * @deprecated Import `StructureToolProviderProps` from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DeskToolProviderProps = _DeskToolProviderProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Divider = _Divider
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentFieldMenuActionNode = _DocumentFieldMenuActionNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentList = _DocumentList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListInput = _DocumentListInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListItem = _DocumentListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListItemInput = _DocumentListItemInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListOptions = _DocumentListOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListPaneNode = _DocumentListPaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentListPaneProps = _DocumentListPaneProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentNode = _DocumentNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentOptions = _DocumentOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentPaneNode = _DocumentPaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentPaneProviderProps = _DocumentPaneProviderProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type DocumentTypeListInput = _DocumentTypeListInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type EditReferenceOptions = _EditReferenceOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type EditorNode = _EditorNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type FormView = _FormView
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type GenericList = _GenericList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type GenericListInput = _GenericListInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type Intent = _Intent
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentChecker = _IntentChecker
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentJsonParams = _IntentJsonParams
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type IntentParams = _IntentParams
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ItemChild = _ItemChild
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type List = _List
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListDisplayOptions = _ListDisplayOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListInput = _ListInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItem = _ListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemChild = _ListItemChild
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemDisplayOptions = _ListItemDisplayOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemInput = _ListItemInput
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListItemSerializeOptions = _ListItemSerializeOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ListPaneNode = _ListPaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItem = _MenuItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemActionType = _MenuItemActionType
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemGroup = _MenuItemGroup
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type MenuItemParamsType = _MenuItemParamsType
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneListItem = _PaneListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneListItemDivider = _PaneListItemDivider
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneMenuItem = _PaneMenuItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneMenuItemGroup = _PaneMenuItemGroup
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneNode = _PaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneNodeResolver = _PaneNodeResolver
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PaneRouterContextValue = _PaneRouterContextValue
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ParameterizedLinkProps = _ParameterizedLinkProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentList = _PartialDocumentList
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentListItem = _PartialDocumentListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialDocumentNode = _PartialDocumentNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialListItem = _PartialListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type PartialMenuItem = _PartialMenuItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type ReferenceChildLinkProps = _ReferenceChildLinkProps
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneGroup = _RouterPaneGroup
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneSibling = _RouterPaneSibling
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPaneSiblingContext = _RouterPaneSiblingContext
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type RouterPanes = _RouterPanes
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type {Serializable} from '../structure'
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializablePaneNode = _SerializablePaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializeOptions = _SerializeOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type SerializePath = _SerializePath
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type SortMenuItem = _SortMenuItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureBuilder = _StructureBuilder
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureBuilderOptions = _StructureBuilderOptions
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureContext = _StructureContext
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureLocaleResourceKeys = _StructureLocaleResourceKeys
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureNode = _StructureNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureResolver = _StructureResolver
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type StructureResolverContext = _StructureResolverContext
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnresolvedPaneNode = _UnresolvedPaneNode
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnserializedListItem = _UnserializedListItem
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type UnserializedListItemChild = _UnserializedListItemChild
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type UserComponent = _UserComponent
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type UserViewComponent = _UserViewComponent
/**
 * @deprecated Import from `@sanity/structure` instead
 * @hidden
 * @beta
 */
export type View = _View
/**
 * @deprecated Import from `@sanity/structure` instead
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
export const PaneRouterContext = _PaneRouterContext
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
