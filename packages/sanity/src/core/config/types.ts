import {type BifurClient} from '@sanity/bifur-client'
import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {
  type AssetSource,
  type CurrentUser,
  type ObjectSchemaType,
  type SanityDocumentLike,
  type Schema,
  type SchemaType,
  type SchemaTypeDefinition,
  type SearchStrategy,
} from '@sanity/types'
import {type i18n} from 'i18next'
import {type ComponentType, type ErrorInfo, type ReactNode} from 'react'
import {type Observable} from 'rxjs'
import {type Router, type RouterState} from 'sanity/router'

import {type FormBuilderCustomMarkersComponent, type FormBuilderMarkersComponent} from '../form'
import {type LocalePluginOptions, type LocaleSource} from '../i18n/types'
import {type ScheduledPublishingPluginOptions} from '../scheduledPublishing/types'
import {type AuthStore} from '../store'
import {type SearchFilterDefinition} from '../studio/components/navbar/search/definitions/filters'
import {type SearchOperatorDefinition} from '../studio/components/navbar/search/definitions/operators'
import {type InitialValueTemplateItem, type Template, type TemplateItem} from '../templates'
import {type StudioTheme} from '../theme'
import {type AuthConfig} from './auth/types'
import {
  type DocumentActionComponent,
  type DocumentBadgeComponent,
  type DocumentFieldAction,
  type DocumentFieldActionsResolver,
  type DocumentFieldActionsResolverContext,
  type DocumentInspector,
} from './document'
import {type FormComponents} from './form'
import {type StudioComponents, type StudioComponentsPluginOptions} from './studio'

/**
 * @hidden
 * @beta
 */
export type AssetSourceResolver = ComposableOption<AssetSource[], ConfigContext>

/**
 * @public
 */
export interface SanityFormConfig {
  /**
   * these have not been migrated over
   *
   *
   * @hidden
   * @beta
   */
  unstable?: {
    CustomMarkers?: FormBuilderCustomMarkersComponent
    Markers?: FormBuilderMarkersComponent
  }

  /**
   * Components for the form.
   * @hidden
   * @beta
   */
  components?: FormComponents

  file?: {
    /**
     * @hidden
     * @beta
     */
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }
  /**
   * @hidden
   * @beta
   */
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
 * A tool can be thought of as a top-level "view" or "app".
 * They are available through the global menu bar, and has a URL route associated with them.
 *
 * In essence, a tool is a React component that is rendered when the tool is active,
 * along with a title, name (URL segment) and icon.
 *
 * Tools can handle {@link structure.Intent | intents} such as "edit" or "create" by defining a
 * function for the `canHandleIntent` property, as well as the `getIntentState` property,
 * which defines what an intent will be mapped to in terms of the tool's URL state.
 *
 * @public
 */
export interface Tool<Options = any> {
  /**
   * The React component that renders the tool.
   */
  component: ComponentType<{tool: Tool<Options>}>

  /**
   * React component for the icon representing the tool.
   */
  icon?: ComponentType

  /**
   * The name of the tool, used as part of the URL.
   */
  name: string

  /**
   * Options are passed through from the configuration to the component defined by the `component`
   */
  options?: Options

  /**
   * The router for the tool. See {@link router.Router}
   */
  router?: Router

  /**
   * Title of the tool - used for the navigation menu item, along with the icon.
   */
  title: string

  /**
   * Determines whether the tool will control the `document.title`.
   */
  controlsDocumentTitle?: boolean

  /**
   * Gets the state for the given intent.
   *
   * @param intent - The intent to get the state for.
   * @param params - The parameters for the intent.
   * @param routerState - The current router state. See {@link router.RouterState}
   * @param payload - The payload for the intent.
   * @returns The state for the intent.
   */
  getIntentState?: (
    intent: string,
    params: Record<string, string>,
    routerState: RouterState | undefined,
    payload: unknown,
  ) => unknown

  /**
   * Determines whether the tool can handle the given intent.
   *
   * Can either return a boolean, or an object where the keys represent the parameters that
   * can/can not be handled. This will be used to determine whether or not a tool is the best
   * suited to handle an intent. Note that an object of only `false` values (or an empty object)
   * is treated as `true`, so you want to explicitly return `false` if you know the intent cannot
   * fulfill the intent request.
   *
   * @param intent - The intent to check.
   * @param params - The parameters for the intent.
   * @param payload - The payload for the intent.
   * @returns Boolean: whether it can handle the intent. Object: Values representing what specific parameters can be handled.
   */
  canHandleIntent?: (
    intent: string,
    params: Record<string, unknown>,
    payload: unknown,
  ) => boolean | {[key: string]: boolean}
}

/** @public */
export type ComposableOption<TValue, TContext> = (prev: TValue, context: TContext) => TValue

/**
 * @hidden
 * @beta
 */
export type AsyncComposableOption<TValue, TContext> = (
  prev: TValue,
  context: TContext,
) => Promise<TValue>

/** @public */
export interface ConfigContext {
  /**
   * The ID of the project.
   */
  projectId: string
  /**
   * The name of the dataset.
   */
  dataset: string
  /**
   * The schema for this source.
   */
  schema: Schema
  /**
   * The current user or `null` if not authenticated.
   */
  currentUser: CurrentUser | null
  /**
   * A function that returns a Sanity client with the {@link SourceClientOptions | specified options}.
   */
  getClient: (options: SourceClientOptions) => SanityClient
  /**
   * Localization resources
   */
  i18n: LocaleSource
}

/** @public */
export type TemplateResolver = ComposableOption<Template[], ConfigContext>

/**
 * @hidden
 * @beta
 */
export interface SchemaPluginOptions {
  name?: string
  types?:
    | SchemaTypeDefinition[]
    | ComposableOption<
        SchemaTypeDefinition[],
        Omit<ConfigContext, 'schema' | 'currentUser' | 'getClient' | 'client' | 'i18n'>
      >
  templates?: Template[] | TemplateResolver
}

/**
 * @hidden
 * @beta
 */
export type NewDocumentOptionsResolver = ComposableOption<TemplateItem[], NewDocumentOptionsContext>

/**
 * @hidden
 * @beta
 */
export interface NewDocumentOptionsContext extends ConfigContext {
  creationContext: NewDocumentCreationContext
}

/**
 * @hidden
 * @beta
 */
export type NewDocumentCreationContext =
  | {type: 'global'; documentId?: undefined; schemaType?: undefined}
  | {type: 'document'; documentId: string; schemaType: string}
  | {type: 'structure'; documentId?: undefined; schemaType: string}

/**
 * @hidden
 * @beta
 */
export interface DocumentPluginOptions {
  badges?: DocumentBadgeComponent[] | DocumentBadgesResolver
  actions?: DocumentActionComponent[] | DocumentActionsResolver

  /**
   * Components for the document.
   * @internal
   */
  components?: DocumentComponents

  /** @internal */
  unstable_fieldActions?: DocumentFieldAction[] | DocumentFieldActionsResolver
  /** @hidden @beta */
  inspectors?: DocumentInspector[] | DocumentInspectorsResolver
  /**
   * @hidden
   * @beta
   */
  productionUrl?: AsyncComposableOption<string | undefined, ResolveProductionUrlContext>
  /**
   * @hidden
   * @beta
   */
  unstable_languageFilter?: DocumentLanguageFilterResolver
  /**
   * @hidden
   * @beta
   */
  newDocumentOptions?: NewDocumentOptionsResolver

  /** @deprecated Use `comments` instead */
  unstable_comments?: {
    enabled: boolean | ((context: DocumentCommentsEnabledContext) => boolean)
  }

  /** @internal */
  comments?: {
    enabled: boolean | ((context: DocumentCommentsEnabledContext) => boolean)
  }
}

/**
 *
 * @hidden
 * @beta
 */
export interface DocumentLanguageFilterContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/**
 *
 * @hidden
 * @beta
 */
export type DocumentLanguageFilterComponent = ComponentType<{schemaType: ObjectSchemaType}>

/**
 *
 * @hidden
 * @beta
 */
export type DocumentLanguageFilterResolver = ComposableOption<
  DocumentLanguageFilterComponent[],
  DocumentLanguageFilterContext
>

/**
 * @hidden
 * @beta
 */
export type DocumentActionsResolver = ComposableOption<
  DocumentActionComponent[],
  DocumentActionsContext
>

/**
 * @hidden
 * @beta
 */
export type DocumentBadgesResolver = ComposableOption<
  DocumentBadgeComponent[],
  DocumentBadgesContext
>

/** @hidden @beta */
export type DocumentInspectorsResolver = ComposableOption<
  DocumentInspector[],
  DocumentInspectorContext
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

  __internal_tasks?: {
    footerAction: ReactNode
  }

  studio?: {
    /**
     * Components for the studio.
     * @hidden
     * @beta
     */
    components?: StudioComponentsPluginOptions
  }

  /** @beta @hidden */
  i18n?: LocalePluginOptions
  search?: {
    unstable_partialIndexing?: {
      enabled: boolean
    }

    /**
     * Control the strategy used for searching documents. This should generally only be used if you
     * wish to try experimental search strategies.
     *
     * This option takes precedence over the deprecated `search.enableLegacySearch` option.
     *
     * Can be one of:
     *
     * - `"groqLegacy"` (default): Use client-side tokenization and schema introspection to search
     *   using the GROQ Query API.
     * - `"groq2024"`: (experimental) Perform full text searching using the GROQ Query API and its
     *   new `text::matchQuery` function.
     */
    strategy?: SearchStrategy

    /**
     * Enables the legacy Query API search strategy.
     *
     * @deprecated Use `search.strategy` instead.
     */
    enableLegacySearch?: boolean
  }

  /** @internal */
  __internal_serverDocumentActions?: WorkspaceOptions['__internal_serverDocumentActions']

  /** Configuration for studio beta features.
   * @internal
   */
  beta?: BetaFeatures

  /** Configuration for error handling.
   * @beta
   */
  onUncaughtError?: (error: Error, errorInfo: ErrorInfo) => void
  /**
   * @hidden
   * @internal
   */
  announcements?: {
    enabled: boolean
  }
}

/** @internal */
export type ConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext,
) => TValue

/** @internal */
export type AsyncConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext,
) => TValue | Promise<TValue>

/**
 * @hidden
 * @beta
 */
export type Plugin<TOptions = void> = (options: TOptions) => PluginOptions

/**
 * @hidden
 * @beta
 */
export interface WorkspaceOptions extends SourceOptions {
  basePath: string
  subtitle?: string
  /**
   * The workspace logo
   *
   * @deprecated Custom logo components are no longer supported.
   * Users are encouraged to provide custom components for individual workspace icons instead.
   */
  logo?: ComponentType
  icon?: ComponentType

  /**
   * @hidden
   * @beta
   */
  theme?: StudioTheme

  /**
   * @hidden
   * @beta
   */
  unstable_sources?: SourceOptions[]
  /**
   * @deprecated Use `tasks` instead
   */
  unstable_tasks?: DefaultPluginsWorkspaceOptions['tasks']
  /**
   * @internal
   */
  tasks?: DefaultPluginsWorkspaceOptions['tasks']
  /**
   * @internal
   */
  releases?: DefaultPluginsWorkspaceOptions['releases']

  /**
   * @hidden
   * @internal
   */
  __internal_serverDocumentActions?: {
    enabled?: boolean
  }

  scheduledPublishing?: DefaultPluginsWorkspaceOptions['scheduledPublishing']
}

/**
 * @hidden
 * @beta
 */
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

  /**
   * Authentication options for this source.
   */
  auth?: AuthConfig | AuthStore

  /**
   * @hidden
   * @beta
   */
  unstable_clientFactory?: (options: SanityClientConfig) => SanityClient
}

/**
 * @hidden
 * @beta
 */
export interface ResolveProductionUrlContext extends ConfigContext {
  document: SanityDocumentLike
}

/**
 * @hidden
 * @beta
 */

export type DocumentActionsVersionType = 'published' | 'draft' | 'revision' | 'version'

/**
 * @hidden
 * @beta
 */
export interface DocumentActionsContext extends ConfigContext {
  documentId?: string
  schemaType: string

  /** releaseId of the open document, it's undefined if it's published or the draft */
  releaseId?: string
  /** the type of the currently active document. */
  versionType?: DocumentActionsVersionType
}

/**
 * @hidden
 * @beta
 */
export interface DocumentBadgesContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/** @hidden @beta */
export interface DocumentInspectorContext extends ConfigContext {
  documentId?: string
  documentType: string
}

/** @hidden @beta */
export interface DocumentCommentsEnabledContext {
  documentId?: string
  documentType: string
}

/**
 * @hidden
 * @beta
 */
export type PartialContext<TContext extends ConfigContext> = Pick<
  TContext,
  Exclude<keyof TContext, keyof ConfigContext>
>

/** @internal*/
export interface DocumentLayoutProps {
  /**
   * The ID of the document. This is a read-only property and changing it will have no effect.
   */
  documentId: string
  /**
   * The type of the document. This is a read-only property and changing it will have no effect.
   */
  documentType: string
  renderDefault: (props: DocumentLayoutProps) => React.JSX.Element
}

interface DocumentComponents {
  /** @internal */
  unstable_layout?: ComponentType<DocumentLayoutProps>
}

/** @public */
export interface SourceClientOptions {
  /**
   * API version to use. See {@link https://www.sanity.io/docs/api-versioning | api-versioning}
   */
  apiVersion: string
}

/**
 * Represents a source.
 * @public
 */
export interface Source {
  /** The type of the source. */
  type: 'source'
  /** The name of the source. */
  name: string
  /** The title of the source. */
  title: string
  /** The ID of the project. */
  projectId: string
  /** The name of the dataset. */
  dataset: string
  /** The schema of the source. */
  schema: Schema
  /** The templates of the source. */
  templates: Template[]
  /** The tools of the source. */
  tools: Tool[]
  /** The current user of the source. */
  currentUser: CurrentUser | null
  /** Whether the user is authenticated. */
  authenticated: boolean

  /** @internal */
  auth: AuthStore

  /**
   * Returns a client instance.
   * @param clientOptions - Options to pass to the client. See {@link SourceClientOptions}
   */
  getClient: (clientOptions: SourceClientOptions) => SanityClient

  /**
   * Document-related functionality.
   * @hidden
   * @beta
   */
  document: {
    /**
     * Returns an array of actions for the document.
     * @hidden
     * @beta
     */
    actions: (props: PartialContext<DocumentActionsContext>) => DocumentActionComponent[]

    /**
     * Returns an array of badges for the document.
     * @hidden
     * @beta
     */
    badges: (props: PartialContext<DocumentActionsContext>) => DocumentBadgeComponent[]

    /**
     * Components for the document.
     * @internal
     */
    components?: DocumentComponents

    /** @internal */
    unstable_fieldActions: (
      props: PartialContext<DocumentFieldActionsResolverContext>,
    ) => DocumentFieldAction[]

    /**
     * Resolves the production URL for the document.
     * @hidden
     * @beta
     */
    resolveProductionUrl: (
      context: PartialContext<ResolveProductionUrlContext>,
    ) => Promise<string | undefined>

    /**
     * Resolves the new document options.
     * @hidden
     * @beta
     */
    resolveNewDocumentOptions: (context: NewDocumentCreationContext) => InitialValueTemplateItem[]

    /** @alpha */
    unstable_languageFilter: (
      props: PartialContext<DocumentLanguageFilterContext>,
    ) => DocumentLanguageFilterComponent[]

    /**
     * @hidden
     * @beta
     */
    inspectors: (props: PartialContext<DocumentInspectorContext>) => DocumentInspector[]

    /** @deprecated  Use `comments` instead */
    unstable_comments: {
      enabled: (props: DocumentCommentsEnabledContext) => boolean
    }

    /** @internal */
    comments: {
      enabled: (props: DocumentCommentsEnabledContext) => boolean
    }
  }

  /** @internal */
  __internal_tasks?: {footerAction: ReactNode}

  /**
   * Form-related functionality.
   * @hidden
   * @beta
   */
  form: {
    /**
     * File-related functionality.
     * @hidden
     * @beta
     */
    file: {
      /** The asset sources. */
      assetSources: AssetSource[]

      /** Whether direct uploads are enabled. */
      directUploads: boolean
    }

    /**
     * Image-related functionality.
     * @hidden
     * @beta
     */
    image: {
      /** The asset sources. */
      assetSources: AssetSource[]

      /** Whether direct uploads are enabled. */
      directUploads: boolean
    }

    /**
     * Components for the form.
     * @hidden
     * @beta
     */
    components?: FormComponents

    /**
     * these have not been migrated over and are not merged by the form builder
     *
     * @hidden
     * @beta
     */
    unstable?: {
      CustomMarkers?: FormBuilderCustomMarkersComponent
      Markers?: FormBuilderMarkersComponent
    }
  }

  /**
   * @hidden
   * @beta
   */
  studio?: {
    /**
     * Components for the studio.
     * @hidden
     * @beta
     */
    components?: StudioComponents
  }

  /** @alpha */
  search: {
    filters: SearchFilterDefinition[]
    operators: SearchOperatorDefinition[]
    unstable_partialIndexing?: {
      enabled: boolean
    }

    enableLegacySearch?: boolean
    strategy?: SearchStrategy
  }

  /** @internal */
  i18n: LocaleSource

  /** @internal */
  __internal: {
    /** @internal */
    bifur: BifurClient
    /** @internal */
    staticInitialValueTemplateItems: InitialValueTemplateItem[]
    /** @internal */
    options: SourceOptions
    /**
     * _VERY_ internal, likely to change at any point.
     * @internal
     */
    i18next: i18n
  }
  /** @beta */
  tasks?: WorkspaceOptions['tasks']

  /** @beta */
  releases?: WorkspaceOptions['releases']

  /** @internal */
  __internal_serverDocumentActions?: WorkspaceOptions['__internal_serverDocumentActions']
  /** Configuration for studio features.
   * @internal
   */
  beta?: BetaFeatures
  /** Configuration for error handling.
   * @beta
   */
  onUncaughtError?: (error: Error, errorInfo: ErrorInfo) => void
  /**
   * @hidden
   * @internal
   */
  announcements?: {
    enabled: boolean
  }
}

/** @internal */
export interface WorkspaceSummary extends DefaultPluginsWorkspaceOptions {
  type: 'workspace-summary'
  name: string
  title: string
  /**
   * User supplied component if provided, otherwise falls back to
   * an automatically generated default icon.
   */
  icon: ReactNode
  /** Returns true if a custom icon has been provided in studio config */
  customIcon: boolean
  subtitle?: string
  basePath: string
  auth: AuthStore
  projectId: string
  dataset: string
  theme: StudioTheme
  schema: Schema
  i18n: LocaleSource
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
      i18n: LocaleSource
      source: Observable<Source>
    }>
  }
}

/**
 * Definition for Workspace
 *
 * @public
 */
export interface Workspace extends Omit<Source, 'type'> {
  type: 'workspace'
  /**
   * URL base path to use, for instance `/myWorkspace`
   * Note that this will be prepended with any _studio_ base path, eg `/studio/myWorkspace`,
   * and is a client-side routing feature. If you're looking to serve your studio from a subpath,
   * you're probably looking for the `basePath` property in `sanity.cli.ts`/`sanity.cli.js`.
   */
  basePath: string
  /** Subtitle to show under the name of the workspace */
  subtitle?: string
  /** React component to use as icon for this workspace */
  icon: ReactNode
  /**
   *
   * @hidden
   * @beta
   */
  unstable_sources: Source[]
  scheduledPublishing: ScheduledPublishingPluginOptions
}

/**
 * If a single workspace is used, not specifying a name or basePath is acceptable
 *
 *
 * @hidden
 * @beta
 */
export type SingleWorkspace = Omit<WorkspaceOptions, 'name' | 'basePath'> & {
  name?: string
  basePath?: string
}

/**
 * @hidden
 * @beta
 */
export type Config = SingleWorkspace | WorkspaceOptions[]

/**
 * @hidden
 * @beta
 */
export interface MissingConfigFile {
  missingConfigFile: true
}

/** @internal */
export interface PreparedConfig {
  type: 'prepared-config'
  workspaces: WorkspaceSummary[]
}

export type {
  AuthConfig,
  AuthProvider,
  CookielessCompatibleLoginMethod,
  LoginMethod,
} from './auth/types'

/** @beta */
export type DefaultPluginsWorkspaceOptions = {
  tasks: {enabled: boolean}
  scheduledPublishing: ScheduledPublishingPluginOptions
  releases: {enabled: boolean}
}

/**
 * @internal
 * Configuration for studio beta features.
 * */
export interface BetaFeatures {
  /**
   * @beta
   * @hidden
   * @deprecated beta feature is no longer available.
   * */
  treeArrayEditing?: {
    /**
     * @deprecated beta feature is no longer available.
     */
    enabled: boolean
  }

  /**
   * @beta
   */
  create?: {
    /**
     * When true, a "Start in Sanity Create" action will be shown for all new documents, in place of regular document actions,
     * when the following are true:
     * - the origin of the current url is listed under Studios in sanity.to/manage (OR fallbackStudioOrigin is provided)
     * - [origin]/static/create-manifest.json is available over HTTP GET
     *
     * The manifest file is automatically created and deployed when deploying studios with `sanity deploy`
     *
     * @see #fallbackStudioOrigin
     */
    startInCreateEnabled?: boolean

    /**
     * To show the "Start in Create" button on localhost, or in studios not listed under Studios in sanity.io/manage
     * provide a fallback origin as a string.
     *
     * The string must be the exactly equal `name` as shown for the Studio in manage, and the studio must have create-manifest.json available.
     *
     * If the provided fallback Studio does not expose create-manifest.json "Start in Sanity Create" will fail when using the fallback.
     *
     * Example: `wonderful.sanity.studio`
     *
     * Keep in mind that when fallback origin is used, Sanity Create will used the schema types and dataset in the *deployed* Studio,
     * not from localhost.
     *
     * To see data synced from Sanity Create in your localhost Studio, you must ensure that the deployed fallback studio uses the same
     * workspace and schemas as your local configuration.
     *
     * @see #startInCreateEnabled
     */
    fallbackStudioOrigin?: string
  }
  /**
   * Config for the history events API .
   *
   * If enabled, it will use the new events API to fetch document history.
   *
   * If it is not enabled, it will continue using the legacy Timeline.
   */
  eventsAPI?: {
    documents?: boolean
    releases?: boolean
  }
}
