import type {BifurClient} from '@sanity/bifur-client'
import type {ClientConfig as SanityClientConfig, SanityClient} from '@sanity/client'
import type {
  AssetSource,
  CurrentUser,
  ObjectSchemaType,
  SanityDocumentLike,
  Schema,
  SchemaType,
  SchemaTypeDefinition,
} from '@sanity/types'
import React, {type ComponentType} from 'react'
import type {Observable} from 'rxjs'
import type {
  FieldProps,
  FormBuilderCustomMarkersComponent,
  FormBuilderMarkersComponent,
  InputProps,
  ItemProps,
} from '../form'
import type {InitialValueTemplateItem, Template, TemplateResponse} from '../templates'
import {PreviewProps} from '../components/previews'
import {AuthStore} from '../store'
import {StudioTheme} from '../theme'
import {SearchFilterDefinition} from '../studio/components/navbar/search/definitions/filters'
import {SearchOperatorDefinition} from '../studio/components/navbar/search/definitions/operators'
import {StudioComponents, StudioComponentsPluginOptions} from './studio'
import {DocumentActionComponent, DocumentBadgeComponent} from './document'
import {Router, RouterState} from 'sanity/router'

/**
 * @beta
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

/** @beta */
export type AssetSourceResolver = ComposableOption<AssetSource[], ConfigContext>

/**
 * @public
 */
export interface SanityFormConfig {
  /**
   * these have not been migrated over
   *
   * @beta
   */
  unstable?: {
    CustomMarkers?: FormBuilderCustomMarkersComponent
    Markers?: FormBuilderMarkersComponent
  }
  /** @beta */
  components?: {
    input?: ComponentType<InputProps>
    field?: ComponentType<FieldProps>
    item?: ComponentType<ItemProps>
    preview?: ComponentType<PreviewProps>
  }
  file?: {
    /** @beta */
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }
  /** @beta */
  image?: {
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }
}

/** @internal */
export interface FormBuilderComponentResolverContext extends ConfigContext {
  schemaType: SchemaType
}

/**
 * @public
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

/** @public */
export type ComposableOption<TValue, TContext> = (prev: TValue, context: TContext) => TValue

/** @beta */
export type AsyncComposableOption<TValue, TContext> = (
  prev: TValue,
  context: TContext
) => Promise<TValue>

/** @public */
export interface ConfigContext {
  projectId: string
  dataset: string
  schema: Schema
  currentUser: CurrentUser | null
  getClient: (options: SourceClientOptions) => SanityClient
}

/** @public */
export type TemplateResolver = ComposableOption<Template[], ConfigContext>

/** @beta */
export interface SchemaPluginOptions {
  name?: string
  types?:
    | SchemaTypeDefinition[]
    | ComposableOption<
        SchemaTypeDefinition[],
        Omit<ConfigContext, 'schema' | 'currentUser' | 'getClient' | 'client'>
      >
  templates?: Template[] | TemplateResolver
}

/** @beta */
export type NewDocumentOptionsResolver = ComposableOption<
  TemplateResponse[],
  NewDocumentOptionsContext
>

/** @beta */
export interface NewDocumentOptionsContext extends ConfigContext {
  creationContext: NewDocumentCreationContext
}

/** @beta */
export type NewDocumentCreationContext =
  | {type: 'global'; documentId?: undefined; schemaType?: undefined}
  | {type: 'document'; documentId: string; schemaType: string}
  | {type: 'structure'; documentId?: undefined; schemaType: string}

/** @beta */
export interface DocumentPluginOptions {
  badges?: DocumentBadgeComponent[] | DocumentBadgesResolver
  actions?: DocumentActionComponent[] | DocumentActionsResolver
  /** @beta */
  productionUrl?: AsyncComposableOption<string | undefined, ResolveProductionUrlContext>
  /** @beta */
  unstable_languageFilter?: DocumentLanguageFilterResolver
  /** @beta */
  newDocumentOptions?: NewDocumentOptionsResolver
}

/**
 * @beta
 */
export interface DocumentLanguageFilterContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/**
 * @beta
 */
export type DocumentLanguageFilterComponent = ComponentType<{schemaType: ObjectSchemaType}>

/**
 * @beta
 */
export type DocumentLanguageFilterResolver = ComposableOption<
  DocumentLanguageFilterComponent[],
  DocumentLanguageFilterContext
>

/** @beta */
export type DocumentActionsResolver = ComposableOption<
  DocumentActionComponent[],
  DocumentActionsContext
>

/** @beta */
export type DocumentBadgesResolver = ComposableOption<
  DocumentBadgeComponent[],
  DocumentBadgesContext
>

/** @beta */
export interface PluginOptions {
  name: string
  plugins?: PluginOptions[]
  schema?: SchemaPluginOptions
  // TODO:
  // components?: ComponentPluginOptions
  document?: DocumentPluginOptions
  tools?: Tool[] | ComposableOption<Tool[], ConfigContext>
  form?: SanityFormConfig
  studio?: {
    components?: StudioComponentsPluginOptions
  }
}

/** @internal */
export type ConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext
) => TValue

/** @internal */
export type AsyncConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext
) => TValue | Promise<TValue>

/** @beta */
export type Plugin<TOptions = void> = (options: TOptions) => PluginOptions

/** @beta */
export interface WorkspaceOptions extends SourceOptions {
  basePath: string
  subtitle?: string
  logo?: ComponentType
  icon?: ComponentType

  /** @beta */
  theme?: StudioTheme

  /** @beta */
  unstable_sources?: SourceOptions[]
}

/** @beta */
export interface SourceOptions extends PluginOptions {
  title?: string

  /**
   * Project ID for this source
   */
  projectId: string

  /**
   * Dataset name for this source
   */
  dataset: string

  /**
   * API hostname used for requests. Generally used for custom CNAMEs, allowing businesses to use
   * their own domain for API requests. Must include protocol:
   * eg `https://sanityapi.mycompany.com`
   *
   * Note that (currently) the project ID will be prepended to the passed URL, so the above
   * example would end up as: `https://<projectId>.sanityapi.mycompany.com`
   */
  apiHost?: string

  /** @internal */
  auth?: AuthStore

  /** @beta */
  unstable_clientFactory?: (options: SanityClientConfig) => SanityClient
}

/** @beta */
export interface ResolveProductionUrlContext extends ConfigContext {
  document: SanityDocumentLike
}

/** @beta */
export interface DocumentActionsContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/** @beta */
export interface DocumentBadgesContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/** @beta */
export type PartialContext<TContext extends ConfigContext> = Pick<
  TContext,
  Exclude<keyof TContext, keyof ConfigContext>
>

/** @public */
export interface SourceClientOptions {
  apiVersion: string
}

/** @public */
export interface Source {
  type: 'source'
  name: string
  title: string
  projectId: string
  dataset: string
  schema: Schema
  templates: Template[]
  tools: Tool[]
  currentUser: CurrentUser | null
  authenticated: boolean

  /** @internal */
  auth: AuthStore

  getClient: (clientOptions: SourceClientOptions) => SanityClient

  document: {
    /** @beta */
    actions: (props: PartialContext<DocumentActionsContext>) => DocumentActionComponent[]

    /** @beta */
    badges: (props: PartialContext<DocumentActionsContext>) => DocumentBadgeComponent[]

    /** @beta */
    resolveProductionUrl: (
      context: PartialContext<ResolveProductionUrlContext>
    ) => Promise<string | undefined>

    /** @beta */
    resolveNewDocumentOptions: (context: NewDocumentCreationContext) => InitialValueTemplateItem[]

    /** @alpha */
    unstable_languageFilter: (
      props: PartialContext<DocumentLanguageFilterContext>
    ) => DocumentLanguageFilterComponent[]
  }
  form: {
    /** @beta */
    file: {
      assetSources: AssetSource[]
      directUploads: boolean
    }

    /** @beta */
    image: {
      assetSources: AssetSource[]
      directUploads: boolean
    }

    /** @beta */
    components?: {
      input?: ComponentType<Omit<InputProps, 'renderDefault'>>
      field?: ComponentType<Omit<FieldProps, 'renderDefault'>>
      item?: ComponentType<Omit<ItemProps, 'renderDefault'>>
      preview?: ComponentType<Omit<PreviewProps, 'renderDefault'>>
    }

    /**
     * these have not been migrated over and are not merged by the form builder
     *
     * @beta
     */
    unstable?: {
      CustomMarkers?: FormBuilderCustomMarkersComponent
      Markers?: FormBuilderMarkersComponent
    }
  }

  studio?: {
    /** @beta */
    components?: StudioComponents
  }

  /** @alpha */
  search: {
    filters: SearchFilterDefinition[]
    operators: SearchOperatorDefinition[]
  }

  /** @internal */
  __internal: {
    bifur: BifurClient
    staticInitialValueTemplateItems: InitialValueTemplateItem[]
    options: SourceOptions
  }
}

/** @internal */
export interface WorkspaceSummary {
  type: 'workspace-summary'
  name: string
  title: string
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

/** @public */
export interface Workspace extends Omit<Source, 'type'> {
  type: 'workspace'
  basePath: string
  subtitle?: string
  icon: React.ReactNode
  /**
   * @beta
   */
  unstable_sources: Source[]
}

/**
 * If a single workspace is used, not specifying a name or basePath is acceptable
 *
 * @beta
 */
export type SingleWorkspace = Omit<WorkspaceOptions, 'name' | 'basePath'> & {
  name?: string
  basePath?: string
}

/** @beta */
export type Config = SingleWorkspace | WorkspaceOptions[]

/** @beta */
export interface MissingConfigFile {
  missingConfigFile: true
}

/** @internal */
export interface PreparedConfig {
  type: 'prepared-config'
  workspaces: WorkspaceSummary[]
}
