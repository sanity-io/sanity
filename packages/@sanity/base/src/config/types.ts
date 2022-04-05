import type {SanityClient} from '@sanity/client'
import type {Schema, CurrentUser, AssetSource, SanityDocumentLike} from '@sanity/types'
import type React from 'react'
import type {Observable} from 'rxjs'
import type {BifurClient} from '@sanity/bifur-client'
import type {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderInputComponentMap,
  FormBuilderMarkersComponent,
  FormInputComponentResolver,
  FormPreviewComponentResolver,
} from '../form'
import type {AuthStore, UserStore} from '../datastores'
import type {AuthController} from '../auth'
import type {StudioTheme} from '../theme'
import type {InitialValueTemplateItem, Template, TemplateResponse} from '../templates'
import type {Router, RouterState} from '../router'
import type {DocumentActionComponent} from '../deskTool/actions'
import type {DocumentBadgeComponent} from '../deskTool/badges'

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

/**
 * @alpha
 */
export interface SanityFormBuilderConfig {
  components?: {
    ArrayFunctions?: FormBuilderArrayFunctionComponent
    CustomMarkers?: FormBuilderCustomMarkersComponent
    Markers?: FormBuilderMarkersComponent
    inputs?: FormBuilderInputComponentMap
  }
  file?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  image?: {
    assetSources?: AssetSource[]
    directUploads?: boolean
  }
  resolveInputComponent?: FormInputComponentResolver
  resolvePreviewComponent?: FormPreviewComponentResolver
}

/**
 * @alpha
 */
export interface Tool<Options = any> {
  component: React.ComponentType<{tool: Tool<Options>}>
  icon?: React.ComponentType
  name: string
  options: Options
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

export type SchemaTypeDefinition = unknown // TODO

export type ComposableOption<TValue, TContext> = (prev: TValue, context: TContext) => TValue
export type AsyncComposableOption<TValue, TContext> = (
  prev: TValue,
  context: TContext
) => Promise<TValue>

export interface ConfigContext {
  projectId: string
  dataset: string
  currentUser: CurrentUser
  schema: Schema
  client: SanityClient
}

export type TemplateResolver = ComposableOption<Template[], ConfigContext>

export interface SchemaPluginOptions {
  types?:
    | SchemaTypeDefinition[]
    | ComposableOption<SchemaTypeDefinition[], Omit<ConfigContext, 'schema' | 'currentUser'>>
  templates?: Template[] | TemplateResolver
}

// interface ComponentPluginOptions {
//   absolutes?: unknown
//   sidecar?: unknown
// }

export type NewDocumentOptionsResolver = ComposableOption<
  TemplateResponse[],
  NewDocumentOptionsContext
>

export interface NewDocumentOptionsContext extends ConfigContext {
  creationContext: NewDocumentCreationContext
}

type NewDocumentCreationContext =
  | {type: 'global'; documentId?: undefined; schemaType?: undefined}
  | {type: 'document'; documentId: string; schemaType: string}
  | {type: 'structure'; documentId?: undefined; schemaType: string}

interface DocumentPluginOptions {
  badges?: DocumentBadgeComponent[] | DocumentBadgesResolver
  actions?: DocumentActionComponent[] | DocumentActionsResolver
  productionUrl?: AsyncComposableOption<string | undefined, ResolveProductionUrlContext>
  newDocumentOptions?: NewDocumentOptionsResolver
}

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
  /**
   * this is marked as unstable because it will change once the alpha 2 is
   * finished.
   */
  unstable_formBuilder?: SanityFormBuilderConfig
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
  basePath?: string
  subtitle?: string
  logo?: React.ComponentType<{'aria-label'?: string}>
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
  unstable_auth?: SanityAuthConfig
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

type PartialContext<TContext extends ConfigContext> = Pick<
  TContext,
  Exclude<keyof TContext, keyof ConfigContext>
>

export interface Source {
  name: string
  title: string
  projectId: string
  dataset: string
  schema: Schema
  templates: Template[]
  client: SanityClient
  tools: Tool[]
  currentUser: CurrentUser
  document: {
    actions: (props: PartialContext<DocumentActionsContext>) => DocumentActionComponent[]
    badges: (props: PartialContext<DocumentActionsContext>) => DocumentBadgeComponent[]
    resolveProductionUrl: (
      context: PartialContext<ResolveProductionUrlContext>
    ) => Promise<string | undefined>
    resolveNewDocumentOptions: (context: NewDocumentCreationContext) => InitialValueTemplateItem[]
  }
  /**
   * this is marked as unstable because it will change once the alpha 2 is
   * finished.
   */
  unstable_formBuilder: SanityFormBuilderConfig
  __internal: {
    auth: {
      controller: AuthController
      store: AuthStore
    }
    bifur: BifurClient
    userStore: UserStore
    staticInitialValueTemplateItems: InitialValueTemplateItem[]
  }
}

export interface Workspace extends Source {
  basePath: string
  subtitle?: string
  logo?: React.ComponentType | React.ReactNode
  theme: StudioTheme
  /**
   * @alpha
   */
  unstable_sources: Source[]
}

export interface ResolvedConfig {
  type: 'resolved-sanity-config'

  /**
   * @internal
   * @deprecated not actually deprecated but don't use or you'll be fired
   */
  __internal: {
    workspaces: PartiallyResolvedWorkspace[]
  }
}

export interface Config {
  type: 'sanity-config'

  /**
   * @internal
   * @deprecated not actually deprecated but don't use or you'll be fired
   */
  __internal: WorkspaceOptions | WorkspaceOptions[]
}

/**
 * @internal
 */
interface PartiallyResolvedWorkspace {
  type: 'partially-resolved-workspace'
  basePath: string
  name: string
  title?: string
  subtitle?: string
  logo?: React.ComponentType<{'aria-label'?: string}>
  theme: StudioTheme
  sources: Array<
    {
      name: string
      projectId: string
      dataset: string
      schema: Schema
    } & Observable<Source>
  >
}
