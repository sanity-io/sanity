/* eslint-disable camelcase */

export type {AuthController, SanityAuthProvider, SanityUser} from '../auth'

export type {
  DefaultPreviewProps,
  GeneralPreviewLayoutKey,
  PortableTextPreviewLayoutKey,
  PreviewLayoutKey,
  PreviewMediaDimensions,
  PreviewProps,
} from '../components/previews'

export * from '../components/DefaultDocument'

export type {
  AsyncComposableOption,
  ComposableOption,
  Config,
  ConfigContext,
  ConfigPropertyError,
  ConfigPropertyErrorOptions,
  ConfigResolutionError,
  ConfigResolutionErrorOptions,
  DocumentActionsContext,
  DocumentActionsResolver,
  DocumentBadgesContext,
  DocumentBadgesResolver,
  DocumentPluginOptions,
  NewDocumentCreationContext,
  NewDocumentOptionsContext,
  NewDocumentOptionsResolver,
  PartialContext,
  Plugin,
  PluginFactory,
  PluginOptions,
  ResolveProductionUrlContext,
  SanityAuthConfig as unstable_SanityAuthConfig,
  SanityFormBuilderConfig as unstable_SanityFormBuilderConfig,
  SchemaError,
  SchemaPluginOptions,
  SchemaTypeDefinition,
  Source,
  SourceOptions,
  TemplateResolver,
  Tool,
  Workspace,
  WorkspaceOptions,
} from '../config'

export {createConfig, createPlugin} from '../config'

export type {
  AuthStateChangedMessage,
  AuthStateState,
  AuthStateConfig,
  AuthStateTokenStore,
  AuthStore,
  CurrentUserError,
  CurrentUserEvent,
  CurrentUserSnapshot,
  EditStateFor,
  GuardedOperation,
  MSG_AUTH_STATE_CHANGED,
  Operation,
  OperationsAPI,
  UserStore,
  WrappedOperation,
} from '../datastores'

export {deskTool} from '../deskTool'

export type {
  DefaultDocumentNodeResolver,
  DeskToolOptions,
  StructureBuilder,
  StructureResolver,
} from '../deskTool'

export type {
  ActionComponent,
  DocumentActionComponent,
  DocumentActionConfirmModalProps,
  DocumentActionDescription,
  DocumentActionModalProps,
  DocumentActionDialogModalProps,
  DocumentActionPopoverModalProps,
  DocumentActionProps,
  DocumentActionResolver,
} from '../deskTool/actions'

export type {
  DocumentBadgeComponent,
  DocumentBadgeProps,
  DocumentBadgeDescription,
} from '../deskTool/badges'

export {
  DeleteAction,
  PublishAction,
  DuplicateAction,
  UnpublishAction,
  DiscardChangesAction,
  HistoryRestoreAction,
} from '../deskTool/actions'

export {
  ComponentBuilder,
  ComponentViewBuilder,
  DocumentBuilder,
  DocumentListBuilder,
  DocumentListItemBuilder,
  DocumentTypeListBuilder,
  FormViewBuilder,
  GenericListBuilder,
  GenericViewBuilder,
  InitialValueTemplateItemBuilder,
  ListBuilder,
  ListItemBuilder,
  MenuItemBuilder,
  MenuItemGroupBuilder,
} from '../deskTool/structureBuilder'

export type {
  BaseGenericList,
  BaseIntentParams,
  BuildableComponent,
  BuildableGenericList,
  BuildableList,
  Child,
  ChildObservable,
  ChildResolver,
  ChildResolverOptions,
  Collection,
  CollectionBuilder,
  Component,
  ComponentInput,
  ComponentView,
  Divider,
  DocumentList,
  DocumentListInput,
  DocumentListItem,
  DocumentListItemInput,
  DocumentListOptions,
  DocumentNode,
  DocumentOptions,
  DocumentTypeListInput,
  EditorNode,
  FormView,
  GenericList,
  GenericListInput,
  Intent,
  IntentChecker,
  IntentJsonParams,
  IntentParams,
  ItemChild,
  List,
  ListDisplayOptions,
  ListInput,
  ListItem,
  ListItemChild,
  ListItemDisplayOptions,
  ListItemInput,
  ListItemSerializeOptions,
  MenuItem,
  MenuItemActionType,
  MenuItemGroup,
  MenuItemParamsType,
  PartialDocumentList,
  PartialDocumentListItem,
  PartialDocumentNode,
  PartialListItem,
  PartialMenuItem,
  Serializable,
  SerializeOptions,
  SerializePath,
  StructureContext,
  StructureNode,
  UnserializedListItem,
  UnserializedListItemChild,
  UserComponent,
  View,
  ViewBuilder,
} from '../deskTool/structureBuilder'

export {isDev, isProd} from '../environment'

export {PatchEvent} from '../form'

export type {
  ArrayFieldProps,
  ArrayInputProps,
  ArrayItemMember,
  ArrayMember,
  BaseFieldProps,
  BaseInputProps,
  BaseItemProps,
  BooleanFieldProps,
  BooleanInputProps,
  BooleanItemProps,
  FieldGroup as FormFieldGroup,
  FieldMember,
  FieldProps,
  FieldSetMember,
  FieldSetProps,
  Focusable,
  FormArrayInputFunctionsProps,
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormDiffMatchPatch,
  FormInputComponentResolver,
  FormInsertPatch,
  FormInsertPatchPosition,
  FormPatch,
  FormPatchJSONValue,
  FormPatchOrigin,
  FormPreviewComponentResolver,
  FormPreviewProps,
  FormSetIfMissingPatch,
  FormSetPatch,
  FormUnsetPatch,
  InputProps,
  InsertEvent,
  ItemProps,
  NumberFieldProps,
  NumberInputProps,
  NumberItemProps,
  ObjectFieldProps,
  ObjectInputProps,
  ObjectItemProps,
  ObjectMember,
  PatchArg,
  PortableTextMarker,
  RenderArrayItemCallback,
  RenderCustomMarkers,
  RenderFieldCallback,
  StringFieldProps,
  StringInputProps,
  StringItemProps,
} from '../form'

export {
  useEditState,
  useValidationStatus,
  useSyncState,
  useConnectionState,
  useDocumentOperation,
} from '../hooks'

export type {ConnectionState, SyncState, ValidationStatus} from '../hooks'

export type {FormFieldPresence} from '../presence'

export type {
  Route,
  RouteChildren,
  RouteSegment,
  RouteTransform,
  Router,
  RouterNode,
  RouterState,
} from '../router'

export {
  useColorScheme,
  useConfig,
  useSource,
  useWorkspace,
  renderStudio,
  SourceProvider,
  Studio,
  StudioProvider,
  WorkspaceProvider,
} from '../studio'

export type {
  SourceProviderProps,
  StudioProps,
  StudioProviderProps,
  WorkspaceProviderProps,
} from '../studio'

export type {StudioTheme} from '../theme'

export {defaultTheme} from '../theme'

export type {Template, TemplateResponse} from '../templates'

export {getDraftId, getPublishedId} from '../util'

export type {
  ArrayFieldDefinition,
  FieldDefinition,
  InitialValueTemplateItem,
  ReferenceTarget,
  TemplateParameter,
  TypeTarget,
} from '../templates'

export type {DraftId, Opaque, PublishedId} from '../util'
