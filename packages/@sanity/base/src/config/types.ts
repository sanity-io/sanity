import type {ClientConfig as SanityClientConfig, SanityClient} from '@sanity/client'
import type {
  Schema,
  SchemaType,
  AssetSource,
  CurrentUser,
  SanityDocumentLike,
  SchemaTypeDefinition,
} from '@sanity/types'
import type React from 'react'
import type {Observable} from 'rxjs'
import type {BifurClient} from '@sanity/bifur-client'
import type {
  FormBuilderArrayFunctionComponent,
  FormBuilderCustomMarkersComponent,
  FormBuilderMarkersComponent,
  InputProps,
  FieldProps,
  ItemProps,
} from '../form'
import type {AuthStore, UserStore} from '../datastores'
import type {AuthController} from '../auth'
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
export interface SanityFormBuilderConfig {
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
    | React.ComponentType<InputProps>
    | {
        input?: React.ComponentType<InputProps>
        field?: React.ComponentType<FieldProps>
        item?: React.ComponentType<ItemProps>
        preview?: React.ComponentType<PreviewProps>
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
  resolve?: {
    input?: FormBuilderInputComponentResolver
    field?: FormBuilderFieldComponentResolver
    item?: FormBuilderItemComponentResolver
    preview?: FormBuilderPreviewComponentResolver
  }
}

export type FormBuilderInputComponentResolver = ComposableOption<
  React.ComponentType<InputProps>,
  FormBuilderComponentResolverContext
>

export type FormBuilderFieldComponentResolver = ComposableOption<
  React.ComponentType<FieldProps>,
  FormBuilderComponentResolverContext
>

export type FormBuilderItemComponentResolver = ComposableOption<
  React.ComponentType<ItemProps>,
  FormBuilderComponentResolverContext
>

export type FormBuilderPreviewComponentResolver = ComposableOption<
  React.ComponentType<PreviewProps>,
  FormBuilderComponentResolverContext
>

export interface FormBuilderComponentResolverContext extends ConfigContext {
  schemaType: SchemaType
}

/**
 * @alpha
 */
export interface Tool<Options = any> {
  component: React.ComponentType<{tool: Tool<Options>}>
  icon?: React.ComponentType
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
  formBuilder?: SanityFormBuilderConfig
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
  navbar?: {
    components?: {
      ToolMenu: React.ComponentType<ToolMenuProps>
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
  unstable_auth?: SanityAuthConfig

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
  formBuilder: {
    resolveInputComponent: (options: {schemaType: SchemaType}) => React.ComponentType<InputProps>
    resolveFieldComponent: (options: {schemaType: SchemaType}) => React.ComponentType<FieldProps>
    resolveItemComponent: (options: {schemaType: SchemaType}) => React.ComponentType<ItemProps>
    resolvePreviewComponent: (options: {
      schemaType: SchemaType
    }) => React.ComponentType<PreviewProps<string>>
    file: {
      assetSources: AssetSource[]
      directUploads: boolean
    }
    image: {
      assetSources: AssetSource[]
      directUploads: boolean
    }
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
  navbar?: {
    components?: {
      ToolMenu?: React.ComponentType<ToolMenuProps>
    }
  }
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
  navbar?: {
    components?: {
      ToolMenu?: React.ComponentType<ToolMenuProps>
    }
  }
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
