import type {ClientConfig as SanityClientConfig, SanityClient} from '@sanity/client'
import type {
  Schema,
  SchemaType,
  AssetSource,
  CurrentUser,
  SanityDocumentLike,
  SchemaTypeDefinition,
  ObjectSchemaType,
} from '@sanity/types'
import type React from 'react'
import type {Observable} from 'rxjs'
import type {BifurClient} from '@sanity/bifur-client'
import {ComponentType, ReactNode} from 'react'
import type {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderMarkersComponent,
  InputProps,
  FieldProps,
  ItemProps,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../form'
import type {AuthStore} from '../datastores'
import type {StudioTheme} from '../theme'
import type {InitialValueTemplateItem, Template, TemplateResponse} from '../templates'
import type {Router, RouterState} from '../router'
import type {DocumentActionComponent} from '../desk/actions'
import type {DocumentBadgeComponent} from '../desk/badges'
import {PreviewProps} from '../components/previews'
import {ToolMenuProps} from '../studio/components/navbar/tools/ToolMenu'

/**
 * @alpha
 */
export interface SanityAuthConfig {
  mode?: 'append' | 'replace'
  redirectOnSingle?: boolean
  providers?: {
    name: string
    title: string
    url: string
    logo?: string
  }[]
}

export type AssetSourceResolver = ComposableOption<AssetSource[], ConfigContext>

/**
 * @alpha
 */
export interface SanityFormConfig {
  /**
   * these have not been migrated over
   */
  unstable?: {
    ArrayFunctions?: FormBuilderArrayFunctionComponent
    CustomMarkers?: FormBuilderCustomMarkersComponent
    Markers?: FormBuilderMarkersComponent
  }
  components?: Record<
    string,
    | ComponentType<InputProps>
    | {
        input?: ComponentType<InputProps>
        field?: ComponentType<FieldProps>
        item?: ComponentType<ItemProps>
        preview?: ComponentType<PreviewProps>
      }
  >
  file?: {
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }
  image?: {
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }

  renderInput?: (props: InputProps, next: RenderInputCallback) => ReactNode
  renderField?: (props: FieldProps, next: RenderFieldCallback) => ReactNode
  renderItem?: (props: ItemProps, next: RenderItemCallback) => ReactNode
  renderPreview?: (
    props: PreviewProps & {schemaType: SchemaType},
    next: RenderPreviewCallback
  ) => ReactNode
}

export interface FormBuilderComponentResolverContext extends ConfigContext {
  schemaType: SchemaType
}

/**
 * @alpha
 */
export interface Tool<Options = any> {
  component: ComponentType<{tool: Tool<Options>}>
  icon?: ComponentType
  name: string
  options?: Options
  router?: Router
  title: string
  getIntentState?: (
    intent: string,
    params: Record<string, string>,
    routerState: RouterState | undefined,
    payload: unknown
  ) => unknown
  canHandleIntent?: (intent: string, params: Record<string, unknown>, payload: unknown) => boolean
}

export type ComposableOption<TValue, TContext> = (prev: TValue, context: TContext) => TValue
export type AsyncComposableOption<TValue, TContext> = (
  prev: TValue,
  context: TContext
) => Promise<TValue>

export interface ConfigContext {
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  client: SanityClient
}

export type TemplateResolver = ComposableOption<Template[], ConfigContext>

export interface SchemaPluginOptions {
  name?: string
  types?:
    | SchemaTypeDefinition[]
    | ComposableOption<
        SchemaTypeDefinition[],
        Omit<ConfigContext, 'schema' | 'currentUser' | 'client'>
      >
  templates?: Template[] | TemplateResolver
}

export type NewDocumentOptionsResolver = ComposableOption<
  TemplateResponse[],
  NewDocumentOptionsContext
>

export interface NewDocumentOptionsContext extends ConfigContext {
  creationContext: NewDocumentCreationContext
}

export type NewDocumentCreationContext =
  | {type: 'global'; documentId?: undefined; schemaType?: undefined}
  | {type: 'document'; documentId: string; schemaType: string}
  | {type: 'structure'; documentId?: undefined; schemaType: string}

export interface DocumentPluginOptions {
  badges?: DocumentBadgeComponent[] | DocumentBadgesResolver
  actions?: DocumentActionComponent[] | DocumentActionsResolver
  productionUrl?: AsyncComposableOption<string | undefined, ResolveProductionUrlContext>
  unstable_languageFilter?: _DocumentLanguageFilterResolver
  newDocumentOptions?: NewDocumentOptionsResolver
}

/**
 * @internal
 */
export interface _DocumentLanguageFilterContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/**
 * @internal
 */
export type _DocumentLanguageFilterComponent = ComponentType<{schemaType: ObjectSchemaType}>

/**
 * @internal
 */
export type _DocumentLanguageFilterResolver = ComposableOption<
  _DocumentLanguageFilterComponent[],
  _DocumentLanguageFilterContext
>

export type DocumentActionsResolver = ComposableOption<
  DocumentActionComponent[],
  DocumentActionsContext
>

export type DocumentBadgesResolver = ComposableOption<
  DocumentBadgeComponent[],
  DocumentBadgesContext
>

export interface PluginOptions {
  name: string
  plugins?: PluginOptions[]
  schema?: SchemaPluginOptions
  // TODO:
  // components?: ComponentPluginOptions
  document?: DocumentPluginOptions
  tools?: Tool[] | ComposableOption<Tool[], ConfigContext>
  form?: SanityFormConfig
}

export type ConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext
) => TValue

export type AsyncConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext
) => TValue | Promise<TValue>

export type Plugin<TOptions = void> = (options: TOptions) => PluginOptions

export interface WorkspaceOptions extends SourceOptions {
  basePath: string
  subtitle?: string
  logo?: ComponentType
  icon?: ComponentType
  navbar?: {
    components?: {
      ToolMenu: ComponentType<ToolMenuProps>
    }
  }
  theme?: StudioTheme
  /**
   * @alpha
   */
  unstable_sources?: SourceOptions[]
}

export interface SourceOptions extends PluginOptions {
  title?: string
  projectId: string
  dataset: string

  /**
   * @alpha
   */
  auth?: AuthStore

  /**
   * @alpha
   */
  unstable_clientFactory?: (options: SanityClientConfig) => SanityClient
}

export interface ResolveProductionUrlContext extends ConfigContext {
  document: SanityDocumentLike
}

export interface DocumentActionsContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

export interface DocumentBadgesContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

export type PartialContext<TContext extends ConfigContext> = Pick<
  TContext,
  Exclude<keyof TContext, keyof ConfigContext>
>

export interface Source {
  type: 'source'
  name: string
  title: string
  projectId: string
  dataset: string
  schema: Schema
  templates: Template[]
  tools: Tool[]
  client: SanityClient
  currentUser: CurrentUser | null
  authenticated: boolean
  auth: AuthStore

  document: {
    actions: (props: PartialContext<DocumentActionsContext>) => DocumentActionComponent[]
    badges: (props: PartialContext<DocumentActionsContext>) => DocumentBadgeComponent[]
    resolveProductionUrl: (
      context: PartialContext<ResolveProductionUrlContext>
    ) => Promise<string | undefined>
    resolveNewDocumentOptions: (context: NewDocumentCreationContext) => InitialValueTemplateItem[]
    unstable_languageFilter: (
      props: PartialContext<_DocumentLanguageFilterContext>
    ) => _DocumentLanguageFilterComponent[]
  }
  form: {
    file: {
      assetSources: AssetSource[]
      directUploads: boolean
    }
    image: {
      assetSources: AssetSource[]
      directUploads: boolean
    }

    renderInput: (props: InputProps) => ReactNode
    renderField: (props: FieldProps) => ReactNode
    renderItem: (props: ItemProps) => ReactNode
    renderPreview: (props: PreviewProps & {schemaType: SchemaType}) => ReactNode

    /**
     * these have not been migrated over and are not merged by the form builder
     */
    unstable?: {
      ArrayFunctions?: FormBuilderArrayFunctionComponent
      CustomMarkers?: FormBuilderCustomMarkersComponent
      Markers?: FormBuilderMarkersComponent
    }
  }
  __internal: {
    bifur: BifurClient
    staticInitialValueTemplateItems: InitialValueTemplateItem[]
  }
}

export interface WorkspaceSummary {
  type: 'workspace-summary'
  name: string
  title: string
  logo?: React.ReactNode
  icon: React.ReactNode
  subtitle?: string
  basePath: string
  auth: AuthStore
  projectId: string
  dataset: string
  theme: StudioTheme
  schema: Schema
  /**
   * @internal
   * @deprecated not actually deprecated but don't use or you'll be fired
   */
  __internal: {
    sources: Array<{
      name: string
      projectId: string
      dataset: string
      title: string
      auth: AuthStore
      schema: Schema
      source: Observable<Source>
    }>
  }
}

export interface Workspace extends Omit<Source, 'type'> {
  type: 'workspace'
  basePath: string
  subtitle?: string
  logo?: React.ReactNode
  icon: React.ReactNode
  navbar?: {
    components?: {
      ToolMenu?: ComponentType<ToolMenuProps>
    }
  }
  /**
   * @alpha
   */
  unstable_sources: Source[]
}

/**
 * If a single workspace is used, not specifying a name or basePath is acceptable
 */
export type SingleWorkspace = Omit<WorkspaceOptions, 'name' | 'basePath'> & {
  name?: string
  basePath?: string
}

export type Config = SingleWorkspace | WorkspaceOptions[]

export interface PreparedConfig {
  type: 'prepared-config'
  workspaces: WorkspaceSummary[]
}
