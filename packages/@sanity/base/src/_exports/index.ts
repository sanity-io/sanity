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

export {isDev, isProd} from '../environment'

export {PatchEvent} from '../form'

export type {
  BaseInputProps,
  BooleanInputProps,
  FormArrayInputFunctionsProps,
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderMarkersComponent,
  FormDiffMatchPatch,
  FormInsertPatch,
  FormInsertPatchPosition,
  FormPatch,
  FormPatchJSONValue,
  FormPatchOrigin,
  FormSetIfMissingPatch,
  FormSetPatch,
  FormUnsetPatch,
  InputProps,
  InsertItemEvent,
  NumberInputProps,
  ObjectInputProps,
  PatchArg,
  PortableTextMarker,
  RenderCustomMarkers,
  RenderFieldCallback,
  StringInputProps,
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
  ToolMenuProps,
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
