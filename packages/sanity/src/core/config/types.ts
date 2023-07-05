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
import type {ComponentType, ReactNode} from 'react'
import type {Observable} from 'rxjs'
import type {
  BlockAnnotationProps,
  BlockProps,
  FieldProps,
  FormBuilderCustomMarkersComponent,
  FormBuilderMarkersComponent,
  InputProps,
  ItemProps,
} from '../form'
import type {I18nPluginOptions, I18nSource} from '../i18n/types'
import type {InitialValueTemplateItem, Template, TemplateItem} from '../templates'
import type {PreviewProps} from '../components/previews'
import type {AuthStore} from '../store'
import type {StudioTheme} from '../theme'
import type {SearchFilterDefinition} from '../studio/components/navbar/search/definitions/filters'
import type {SearchOperatorDefinition} from '../studio/components/navbar/search/definitions/operators'
import type {StudioComponents, StudioComponentsPluginOptions} from './studio'
import type {AuthConfig} from './auth/types'
import type {
  DocumentActionComponent,
  DocumentBadgeComponent,
  DocumentFieldAction,
  DocumentFieldActionsResolver,
  DocumentFieldActionsResolverContext,
  DocumentInspector,
} from './document'
import type {Router, RouterState} from 'sanity/router'

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
   * @hidden
   * @beta
   */
  components?: {
    input?: ComponentType<InputProps>
    field?: ComponentType<FieldProps>
    item?: ComponentType<ItemProps>
    preview?: ComponentType<PreviewProps>
    block?: ComponentType<BlockProps>
    inlineBlock?: ComponentType<BlockProps>
    annotation?: ComponentType<BlockAnnotationProps>
  }
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
 * Tools can handle {@link desk.Intent | intents} such as "edit" or "create" by defining a
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
   * @param intent - The intent to check.
   * @param params - The parameters for the intent.
   * @param payload - The payload for the intent.
   * @returns `true` if the tool can handle the intent, `false` otherwise.
   */
  canHandleIntent?: (intent: string, params: Record<string, unknown>, payload: unknown) => boolean
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
        Omit<ConfigContext, 'schema' | 'currentUser' | 'getClient' | 'client'>
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

  /** @internal */
  unstable_comments?: {
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
  studio?: {
    components?: StudioComponentsPluginOptions
  }
  /** @beta @hidden */
  i18n?: I18nPluginOptions
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
export interface DocumentActionsContext extends ConfigContext {
  documentId?: string
  schemaType: string
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

    /** @internal */
    unstable_comments: {
      enabled: (props: DocumentCommentsEnabledContext) => boolean
    }
  }

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
    components?: {
      input?: ComponentType<Omit<InputProps, 'renderDefault'>>
      field?: ComponentType<Omit<FieldProps, 'renderDefault'>>
      item?: ComponentType<Omit<ItemProps, 'renderDefault'>>
      preview?: ComponentType<Omit<PreviewProps, 'renderDefault'>>
    }

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
     * @hidden
     * @beta
     */
    components?: StudioComponents
  }

  /** @alpha */
  search: {
    filters: SearchFilterDefinition[]
    operators: SearchOperatorDefinition[]
  }

  /** @internal */
  i18n: I18nSource

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
  icon: ReactNode
  subtitle?: string
  basePath: string
  auth: AuthStore
  projectId: string
  dataset: string
  theme: StudioTheme
  schema: Schema
  i18n: I18nSource
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
      i18n: I18nSource
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

export type {AuthConfig, AuthProvider} from './auth/types'
