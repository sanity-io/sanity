export type {
  DocumentActionComponent,
  DocumentActionConfirmModalProps,
  DocumentActionDescription,
  DocumentActionModalProps,
  DocumentActionDialogModalProps,
  DocumentActionPopoverModalProps,
  DocumentActionProps,
  DocumentActionResolver,
  DocumentBadgeComponent,
  DocumentBadgeDescription,
  DefaultDocumentNodeResolver,
  DeskToolOptions,
  StructureBuilder,
  StructureResolver,
} from '../deskTool'

export {
  deskTool,
  DeleteAction,
  PublishAction,
  DuplicateAction,
  UnpublishAction,
  DiscardChangesAction,
  HistoryRestoreAction,
} from '../deskTool'

export type {
  AsyncComposableOption,
  ComposableOption,
  ConfigContext,
  ConfigPropertyError,
  ConfigResolutionError,
  ConfigResolutionErrorOptions,
  DocumentActionsContext,
  DocumentActionsResolver,
  DocumentBadgesContext,
  DocumentBadgesResolver,
  NewDocumentOptionsContext,
  NewDocumentOptionsResolver,
  Plugin,
  PluginOptions,
  ResolveProductionUrlContext,
  SanityAuthConfig as Unstable_SanityAuthConfig,
  SanityFormBuilderConfig as Unstable_SanityFormBuilderConfig,
  Config,
  Tool,
  SchemaError,
  SchemaPluginOptions,
  Source,
  SourceOptions,
  TemplateResolver,
  Workspace,
  WorkspaceOptions,
} from '../config'

export {createConfig, createPlugin} from '../config'

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

export type {StudioProps, StudioProviderProps} from '../studio'

export type {StudioTheme} from '../theme'

export {defaultTheme} from '../theme'

export type {Template, TemplateResponse} from '../templates'

export {getDraftId, getPublishedId} from '../util'

export {
  useEditState,
  useValidationStatus,
  useSyncState,
  useConnectionState,
  useDocumentOperation,
} from '../hooks'

export {DefaultDocument} from '../components'
