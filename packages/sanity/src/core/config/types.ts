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
import type {i18n, InitOptions, TFunction, ResourceLanguage} from 'i18next'
import type {
  BlockAnnotationProps,
  BlockProps,
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
import {
  DocumentActionComponent,
  DocumentBadgeComponent,
  DocumentFieldAction,
  DocumentFieldActionsResolver,
  DocumentFieldActionsResolverContext,
  DocumentInspector,
} from './document'
import {StudioComponents, StudioComponentsPluginOptions} from './studio'
import {Router, RouterState} from 'sanity/router'

/**
 *
 * @hidden
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

/**
 * @hidden
 * @beta */
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
   * @beta */
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
     * @beta */
    assetSources?: AssetSource[] | AssetSourceResolver
    // TODO: this option needs more thought on composition and availability
    directUploads?: boolean
  }
  /**
   * @hidden
   * @beta */
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

/**
 * @hidden
 * @beta */
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

/**
 * @hidden
 * @beta */
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
 * @beta */
export type NewDocumentOptionsResolver = ComposableOption<
  TemplateResponse[],
  NewDocumentOptionsContext
>

/**
 * @hidden
 * @beta */
export interface NewDocumentOptionsContext extends ConfigContext {
  creationContext: NewDocumentCreationContext
}

/**
 * @hidden
 * @beta */
export type NewDocumentCreationContext =
  | {type: 'global'; documentId?: undefined; schemaType?: undefined}
  | {type: 'document'; documentId: string; schemaType: string}
  | {type: 'structure'; documentId?: undefined; schemaType: string}

/**
 * @hidden
 * @beta */
export interface DocumentPluginOptions {
  badges?: DocumentBadgeComponent[] | DocumentBadgesResolver
  actions?: DocumentActionComponent[] | DocumentActionsResolver
  /** @internal */
  unstable_fieldActions?: DocumentFieldAction[] | DocumentFieldActionsResolver
  /** @hidden @beta */
  inspectors?: DocumentInspector[] | DocumentInspectorsResolver
  /**
   * @hidden
   * @beta */
  productionUrl?: AsyncComposableOption<string | undefined, ResolveProductionUrlContext>
  /**
   * @hidden
   * @beta */
  unstable_languageFilter?: DocumentLanguageFilterResolver
  /**
   * @hidden
   * @beta */
  newDocumentOptions?: NewDocumentOptionsResolver
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
 * @beta */
export type DocumentActionsResolver = ComposableOption<
  DocumentActionComponent[],
  DocumentActionsContext
>

/**
 * @hidden
 * @beta */
export type DocumentBadgesResolver = ComposableOption<
  DocumentBadgeComponent[],
  DocumentBadgesContext
>

/** @hidden @beta */
export type DocumentInspectorsResolver = ComposableOption<
  DocumentInspector[],
  DocumentInspectorContext
>

/**
 * @hidden
 * @beta
 */
export interface I18nContext {
  projectId: string
  dataset: string
}

/**
 * @hidden
 * @beta
 */
export interface LanguageBundle {
  namespace: string
  resources: ResourceLanguage
  /** Should the resources be merged deeply (nested objects). Default: true */
  deep?: boolean
  /** Should existing resource keys for the namespace be overwritten. Default: false */
  overwrite?: boolean
}

/** @beta @hidden */
export type I18nLanguagesOption =
  | ((prev: LanguageDefinition[], context: I18nContext) => LanguageDefinition[])
  | LanguageDefinition[]

/** @beta @hidden */
export type I18nLanguageLoaderOption =
  | ((prev: LanguageLoader[], context: I18nContext) => LanguageLoader[])
  | LanguageLoader[]

/** @beta @hidden */
export interface I18nPluginOptions {
  /**
   * Defines which languages should be available for user selection.
   * Prev is initially `[{id: 'en-US', title: 'English (US)', icon: AmericanFlag }]`
   *
   * Language titles and icons can be changed by transforming the LanguageDefinition array values.
   *
   * User selected language
   */
  languages?: I18nLanguagesOption

  /**
   * Allows redefining the I18next init options before they are used.
   * Invoked when a workspace is loaded
   */
  initOptions?: (options: InitOptions, context: I18nContext) => InitOptions

  /**
   * Defines language bundles that will be loaded lazily.
   *
   * ### Example
   *
   * ```ts
   *
   * ```
   *
   */
  languageLoaders?: I18nLanguageLoaderOption

  /**
   * When this is true, schema type title and descriptions will be translated.
   * Configure a languageLoader that returns a language bundle for the `schema` namespace,
   * with resource keys using the following convention:
   *
   * ## Keys for types
   *
   * - `<typeName>.type-title`
   * - `<typeName>.type-description`
   * - `<typeName>.<fieldsetName>.fieldset-title`
   * - `<typeName>.<fieldsetName>.fieldset-description`
   * - `<typeName>.<groupName>.group-title`
   *
   * ## Keys for fields
   *
   * - `<objectTypeName>.<fieldName>.field-title`
   * - `<objectTypeName>.<fieldName>.field-description`
   *
   * ## Keys for array items
   *
   * - `<arrayTypeName>.<arrayMemberTypeName>.item-title`
   *
   * ## Keys for reference types
   *
   * - `<typeName>.<refTypeName>.ref-title`
   *
   * ## Caveats
   *
   * Enabling schema translations could adversely impact studio performance.
   * Inline definitions for objects are not supported (nested types).
   *
   * ## Example LanguageBundle
   *
   *```ts
   * // locales/en_US/schema.ts
   * export default {
   *   namespace: 'schema',
   *   resources: {
   *     'myDocumentType|title': 'Document type 'myDocumentType' will use this string as title wherever it is used',
   *
   *     'myDocumentType.text|title': 'Document field named 'text' will use this string as title'
   *     'myDocumentType.text|description': 'Document field named 'text' will this string as description',
   *   },
   *  }
   *```
   *
   * Now, in studio.config.ts:
   * ```ts
   * defineConfig({
   *   i18n: {
   *     experimentalTranslateSchemas: true,
   *     languageLoaders: [
   *         (lang) => import(`./locales/${lang}/schema.ts`),
   *     ]
   *   },
   * })
   * ```
   */
  experimentalTranslateSchemas?: boolean
}

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
  context: TContext
) => TValue

/** @internal */
export type AsyncConfigPropertyReducer<TValue, TContext> = (
  prev: TValue,
  config: PluginOptions,
  context: TContext
) => TValue | Promise<TValue>

/**
 * @hidden
 * @beta */
export type Plugin<TOptions = void> = (options: TOptions) => PluginOptions

/**
 * @hidden
 * @beta */
export interface WorkspaceOptions extends SourceOptions {
  basePath: string
  subtitle?: string
  logo?: ComponentType
  icon?: ComponentType

  /**
   * @hidden
   * @beta */
  theme?: StudioTheme

  /**
   * @hidden
   * @beta */
  unstable_sources?: SourceOptions[]
}

/**
 * @hidden
 * @beta */
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

  /**
   * @hidden
   * @beta */
  unstable_clientFactory?: (options: SanityClientConfig) => SanityClient
}

/**
 * @hidden
 * @beta */
export interface ResolveProductionUrlContext extends ConfigContext {
  document: SanityDocumentLike
}

/**
 * @hidden
 * @beta */
export interface DocumentActionsContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/**
 * @hidden
 * @beta */
export interface DocumentBadgesContext extends ConfigContext {
  documentId?: string
  schemaType: string
}

/** @hidden @beta */
export interface DocumentInspectorContext extends ConfigContext {
  documentId?: string
  documentType: string
}

/**
 * @hidden
 * @beta */
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
    /**
     * @hidden
     * @beta */
    actions: (props: PartialContext<DocumentActionsContext>) => DocumentActionComponent[]

    /**
     * @hidden
     * @beta */
    badges: (props: PartialContext<DocumentActionsContext>) => DocumentBadgeComponent[]

    /** @internal */
    unstable_fieldActions: (
      props: PartialContext<DocumentFieldActionsResolverContext>
    ) => DocumentFieldAction[]

    /**
     * @hidden
     * @beta */
    resolveProductionUrl: (
      context: PartialContext<ResolveProductionUrlContext>
    ) => Promise<string | undefined>

    /**
     * @hidden
     * @beta */
    resolveNewDocumentOptions: (context: NewDocumentCreationContext) => InitialValueTemplateItem[]

    /** @beta @hidden */
    unstable_languageFilter: (
      props: PartialContext<DocumentLanguageFilterContext>
    ) => DocumentLanguageFilterComponent[]

    /** @hidden @beta */
    inspectors: (props: PartialContext<DocumentInspectorContext>) => DocumentInspector[]
  }
  form: {
    /**
     * @hidden
     * @beta */
    file: {
      assetSources: AssetSource[]
      directUploads: boolean
    }

    /**
     * @hidden
     * @beta */
    image: {
      assetSources: AssetSource[]
      directUploads: boolean
    }

    /**
     * @hidden
     * @beta */
    components?: {
      input?: ComponentType<Omit<InputProps, 'renderDefault'>>
      field?: ComponentType<Omit<FieldProps, 'renderDefault'>>
      item?: ComponentType<Omit<ItemProps, 'renderDefault'>>
      preview?: ComponentType<Omit<PreviewProps, 'renderDefault'>>
    }

    /**
     * these have not been migrated over and are not merged by the form builder
     *
     *
     * @hidden
     * @beta
     */
    unstable?: {
      CustomMarkers?: FormBuilderCustomMarkersComponent
      Markers?: FormBuilderMarkersComponent
    }
  }

  studio?: {
    /**
     * @hidden
     * @beta */
    components?: StudioComponents
  }

  /** @beta @hidden */
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

/** @beta @hidden */
export interface LanguageDefinition {
  id: string
  title: string
  icon?: ComponentType
}

/** @beta @hidden */
export type LanguageLoaderResult = Promise<LanguageBundle | {default: LanguageBundle} | undefined>

/** @beta @hidden */
export type LanguageLoader = (language: string, context: {i18n: i18n}) => LanguageLoaderResult

/** @internal */
export interface I18nSource {
  languages: LanguageDefinition[]
  initOptions: InitOptions
  languageLoaders: LanguageLoader[]
  t: TFunction
  i18next: i18n
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

/** @public */
export interface Workspace extends Omit<Source, 'type'> {
  type: 'workspace'
  basePath: string
  subtitle?: string
  icon: React.ReactNode
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
 * @beta */
export type Config = SingleWorkspace | WorkspaceOptions[]

/**
 * @hidden
 * @beta */
export interface MissingConfigFile {
  missingConfigFile: true
}

/** @internal */
export interface PreparedConfig {
  type: 'prepared-config'
  workspaces: WorkspaceSummary[]
}
