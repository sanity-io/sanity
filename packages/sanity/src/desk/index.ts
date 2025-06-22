/**
 * This is a _FALLBACK MODULE_ provided for backwards compatibility, and is likely to be removed
 * in Sanity v4.0.0. Please import from `sanity/structure` instead.
 *
 * @deprecated Use `sanity/structure` instead.
 */
import {
  type BackLinkProps as _BackLinkProps,
  type ChildLinkProps as _ChildLinkProps,
  type EditReferenceOptions as _EditReferenceOptions,
  type PaneRouterContextValue as _PaneRouterContextValue,
  type ParameterizedLinkProps as _ParameterizedLinkProps,
  type ReferenceChildLinkProps as _ReferenceChildLinkProps,
} from '../structure/components/paneRouter/types'
import {
  type BaseGenericList as _BaseGenericList,
  type BuildableGenericList as _BuildableGenericList,
  type GenericList as _GenericList,
  type GenericListInput as _GenericListInput,
  type ListDisplayOptions as _ListDisplayOptions,
  shallowIntentChecker as _shallowIntentChecker,
} from '../structure/structureBuilder/GenericList'
import {
  type BaseIntentParams as _BaseIntentParams,
  DEFAULT_INTENT_HANDLER as _DEFAULT_INTENT_HANDLER,
  defaultIntentChecker as _defaultIntentChecker,
  type Intent as _Intent,
  type IntentChecker as _IntentChecker,
  type IntentJsonParams as _IntentJsonParams,
  type IntentParams as _IntentParams,
} from '../structure/structureBuilder/Intent'
import {
  type BaseView as _BaseView,
  maybeSerializeView as _maybeSerializeView,
  type ViewBuilder as _ViewBuilder,
} from '../structure/structureBuilder/views/View'
import {
  type BuildableComponent as _BuildableComponent,
  type Component as _Component,
  ComponentBuilder as _ComponentBuilder,
  type ComponentInput as _ComponentInput,
} from '../structure/structureBuilder/Component'
import {
  type BuildableList as _BuildableList,
  type List as _List,
  ListBuilder as _ListBuilder,
  type ListInput as _ListInput,
} from '../structure/structureBuilder/List'
import {
  type Builder as _Builder,
  type Child as _Child,
  type Collection as _Collection,
  type CollectionBuilder as _CollectionBuilder,
  type Divider as _Divider,
  type DocumentNode as _DocumentNode,
  type EditorNode as _EditorNode,
  type SerializeOptions as _SerializeOptions,
  type SerializePath as _SerializePath,
  type StructureNode as _StructureNode,
} from '../structure/structureBuilder/StructureNodes'
import {
  type ChildObservable as _ChildObservable,
  type ChildResolver as _ChildResolver,
  type ChildResolverOptions as _ChildResolverOptions,
  type ItemChild as _ItemChild,
} from '../structure/structureBuilder/ChildResolver'
import {
  component as _component,
  DocumentPaneProvider as _DocumentPaneProvider,
  form as _form,
  GenericListBuilder as _GenericListBuilder,
  GenericViewBuilder as _GenericViewBuilder,
  structureLocaleNamespace as _structureLocaleNamespace,
  type StructureToolMenuItem as _DeskToolMenuItem,
} from '../structure'
import {
  type ComponentView as _ComponentView,
  ComponentViewBuilder as _ComponentViewBuilder,
} from '../structure/structureBuilder/views/ComponentView'
import {
  ConfirmDeleteDialog as _ConfirmDeleteDialog,
  type ConfirmDeleteDialogProps as _ConfirmDeleteDialogProps,
} from '../structure/components/confirmDeleteDialog'
import {
  createStructureBuilder as _createStructureBuilder,
  type StructureBuilderOptions as _StructureBuilderOptions,
} from '../structure/structureBuilder/createStructureBuilder'
import {
  type CustomComponentPaneNode as _CustomComponentPaneNode,
  type DocumentFieldMenuActionNode as _DocumentFieldMenuActionNode,
  type DocumentListPaneNode as _DocumentListPaneNode,
  type DocumentPaneNode as _DocumentPaneNode,
  type ListPaneNode as _ListPaneNode,
  type PaneListItem as _PaneListItem,
  type PaneListItemDivider as _PaneListItemDivider,
  type PaneMenuItem as _PaneMenuItem,
  type PaneMenuItemGroup as _PaneMenuItemGroup,
  type PaneNode as _PaneNode,
  type PaneNodeResolver as _PaneNodeResolver,
  type RouterPaneGroup as _RouterPaneGroup,
  type RouterPanes as _RouterPanes,
  type RouterPaneSibling as _RouterPaneSibling,
  type RouterPaneSiblingContext as _RouterPaneSiblingContext,
  type SerializablePaneNode as _SerializablePaneNode,
  type StructureResolver as _StructureResolver,
  type StructureResolverContext as _StructureResolverContext,
  type StructureToolContextValue as _DeskToolContextValue,
  type StructureToolFeatures as _DeskToolFeatures,
  type StructureToolOptions as _DeskToolOptions,
  type StructureToolPaneActionHandler as _DeskToolPaneActionHandler,
  type UnresolvedPaneNode as _UnresolvedPaneNode,
} from '../structure/types'
import {
  type DefaultDocumentNodeContext as _DefaultDocumentNodeContext,
  type DefaultDocumentNodeResolver as _DefaultDocumentNodeResolver,
  type StructureBuilder as _StructureBuilder,
  type StructureContext as _StructureContext,
  type UserComponent as _UserComponent,
  type UserViewComponent as _UserViewComponent,
  type View as _View,
} from '../structure/structureBuilder/types'
import {
  defaultInitialValueTemplateItems as _defaultInitialValueTemplateItems,
  InitialValueTemplateItemBuilder as _InitialValueTemplateItemBuilder,
  maybeSerializeInitialValueTemplateItem as _maybeSerializeInitialValueTemplateItem,
  menuItemsFromInitialValueTemplateItems as _menuItemsFromInitialValueTemplateItems,
} from '../structure/structureBuilder/InitialValueTemplateItem'
import {
  DocumentBuilder as _DocumentBuilder,
  documentFromEditor as _documentFromEditor,
  documentFromEditorWithInitialValue as _documentFromEditorWithInitialValue,
  type DocumentOptions as _DocumentOptions,
  type PartialDocumentNode as _PartialDocumentNode,
} from '../structure/structureBuilder/Document'
import {DocumentInspectorHeader as _DocumentInspectorHeader} from '../structure/panes/document/documentInspector/DocumentInspectorHeader'
import {
  type DocumentList as _DocumentList,
  DocumentListBuilder as _DocumentListBuilder,
  type DocumentListInput as _DocumentListInput,
  type DocumentListOptions as _DocumentListOptions,
  getTypeNamesFromFilter as _getTypeNamesFromFilter,
  type PartialDocumentList as _PartialDocumentList,
} from '../structure/structureBuilder/DocumentList'
import {
  type DocumentListItem as _DocumentListItem,
  DocumentListItemBuilder as _DocumentListItemBuilder,
  type DocumentListItemInput as _DocumentListItemInput,
  isDocumentListItem as _isDocumentListItem,
  type PartialDocumentListItem as _PartialDocumentListItem,
} from '../structure/structureBuilder/DocumentListItem'
import {
  DocumentListPane as _DocumentListPane,
  type DocumentListPaneProps as _DocumentListPaneProps,
} from '../structure/panes/documentList'
import {DocumentPane as _DocumentPane} from '../structure/panes/document/DocumentPane'
import type {DocumentPaneProviderProps} from '../structure/panes/document/types'
import {
  DocumentTypeListBuilder as _DocumentTypeListBuilder,
  type DocumentTypeListInput as _DocumentTypeListInput,
} from '../structure/structureBuilder/DocumentTypeList'
import {
  type FormView as _FormView,
  FormViewBuilder as _FormViewBuilder,
} from '../structure/structureBuilder/views/FormView'
import {
  getOrderingMenuItem as _getOrderingMenuItem,
  getOrderingMenuItemsForSchemaType as _getOrderingMenuItemsForSchemaType,
  maybeSerializeMenuItem as _maybeSerializeMenuItem,
  type MenuItem as _MenuItem,
  type MenuItemActionType as _MenuItemActionType,
  MenuItemBuilder as _MenuItemBuilder,
  type MenuItemParamsType as _MenuItemParamsType,
  type PartialMenuItem as _PartialMenuItem,
  type SortMenuItem as _SortMenuItem,
} from '../structure/structureBuilder/MenuItem'
import {
  HELP_URL as _HELP_URL,
  SerializeError as _SerializeError,
} from '../structure/structureBuilder/SerializeError'
import {
  type ListItem as _ListItem,
  ListItemBuilder as _ListItemBuilder,
  type ListItemChild as _ListItemChild,
  type ListItemDisplayOptions as _ListItemDisplayOptions,
  type ListItemInput as _ListItemInput,
  type ListItemSerializeOptions as _ListItemSerializeOptions,
  type PartialListItem as _PartialListItem,
  type UnserializedListItem as _UnserializedListItem,
  type UnserializedListItemChild as _UnserializedListItemChild,
} from '../structure/structureBuilder/ListItem'
import {
  maybeSerializeMenuItemGroup as _maybeSerializeMenuItemGroup,
  type MenuItemGroup as _MenuItemGroup,
  MenuItemGroupBuilder as _MenuItemGroupBuilder,
} from '../structure/structureBuilder/MenuItemGroup'
import {PaneLayout as _PaneLayout} from '../structure/components/pane/PaneLayout'
import type {StructureLocaleResourceKeys} from '../structure/i18n/resources'
import {structureTool as _structureTool} from '../structure/structureTool'
import {
  StructureToolProvider as _DeskToolProvider,
  type StructureToolProviderProps as _DeskToolProviderProps,
} from '../structure/StructureToolProvider'
import {useDocumentPane as _useDocumentPane} from '../structure/panes/document/useDocumentPane'
import {useDocumentTitle as _useDocumentTitle} from '../structure/panes/document/useDocumentTitle'
import {usePaneRouter as _usePaneRouter} from '../structure/components/paneRouter/usePaneRouter'
import {useStructureTool as _useStructureTool} from '../structure/useStructureTool'

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
