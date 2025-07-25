import {fromUrl} from '@sanity/bifur-client'
import {createClient, type SanityClient} from '@sanity/client'
import {type CurrentUser, type Schema, type SchemaValidationProblem} from '@sanity/types'
import {studioTheme} from '@sanity/ui'
import debugit from 'debug'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type i18n} from 'i18next'
import {startCase} from 'lodash'
import {type ComponentType, type ElementType, type ErrorInfo, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {map, shareReplay} from 'rxjs/operators'

import {
  createDatasetFileAssetSource,
  createDatasetImageAssetSource,
} from '../form/studio/assetSourceDataset'
import {
  createSanityMediaLibraryFileSource,
  createSanityMediaLibraryImageSource,
} from '../form/studio/assetSourceMediaLibrary'
import {type LocaleSource} from '../i18n'
import {prepareI18n} from '../i18n/i18nConfig'
import {createSchema} from '../schema'
import {type AuthStore, createAuthStore, isAuthStore} from '../store/_legacy'
import {validateWorkspaces} from '../studio'
import {filterDefinitions} from '../studio/components/navbar/search/definitions/defaultFilters'
import {operatorDefinitions} from '../studio/components/navbar/search/definitions/operators/defaultOperators'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {type InitialValueTemplateItem, type Template, type TemplateItem} from '../templates'
import {EMPTY_ARRAY, isNonNullable} from '../util'
import {
  announcementsEnabledReducer,
  directUploadsReducer,
  documentActionsReducer,
  documentBadgesReducer,
  documentCommentsEnabledReducer,
  documentInspectorsReducer,
  documentLanguageFilterReducer,
  draftsEnabledReducer,
  eventsAPIReducer,
  fileAssetSourceResolver,
  imageAssetSourceResolver,
  initialDocumentActions,
  initialDocumentBadges,
  initialLanguageFilter,
  internalTasksReducer,
  legacySearchEnabledReducer,
  mediaLibraryEnabledReducer,
  mediaLibraryLibraryIdReducer,
  newDocumentOptionsResolver,
  onUncaughtErrorResolver,
  partialIndexingEnabledReducer,
  resolveProductionUrlReducer,
  schemaTemplatesReducer,
  searchStrategyReducer,
  serverDocumentActionsReducer,
  toolsReducer,
} from './configPropertyReducers'
import {ConfigResolutionError} from './ConfigResolutionError'
import {createDefaultIcon} from './createDefaultIcon'
import {documentFieldActionsReducer, initialDocumentFieldActions} from './document'
import {resolveConfigProperty} from './resolveConfigProperty'
import {getDefaultPlugins, getDefaultPluginsOptions} from './resolveDefaultPlugins'
import {resolveSchemaTypes} from './resolveSchemaTypes'
import {SchemaError} from './SchemaError'
import {
  type Config,
  type ConfigContext,
  type MissingConfigFile,
  type PluginOptions,
  type PreparedConfig,
  type SingleWorkspace,
  type Source,
  type SourceClientOptions,
  type SourceOptions,
  type WorkspaceOptions,
  type WorkspaceSummary,
} from './types'
import {uploadSchema} from './uploadSchema'

type InternalSource = WorkspaceSummary['__internal']['sources'][number]

const debug = debugit('sanity:config')

const isError = (p: SchemaValidationProblem) => p.severity === 'error'

function normalizeIcon(
  Icon: ComponentType | ElementType | undefined,
  title: string,
  subtitle = '',
): React.JSX.Element {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return createDefaultIcon(title, subtitle)
}

const preparedWorkspaces = new WeakMap<SingleWorkspace | WorkspaceOptions, WorkspaceSummary>()

// Create media library sources with configuration
const createMediaLibraryAssetSources = (config: PluginOptions) => {
  const libraryId = mediaLibraryLibraryIdReducer({config, initialValue: undefined})
  const enabled = mediaLibraryEnabledReducer({config, initialValue: false})

  // Only create sources if media library is enabled
  if (!enabled) {
    return {fileSource: null, imageSource: null}
  }

  const fileSource = createSanityMediaLibraryFileSource({
    libraryId: libraryId || null,
  })

  const imageSource = createSanityMediaLibraryImageSource({
    libraryId: libraryId || null,
  })

  return {fileSource, imageSource}
}

// Create default asset sources with configuration
const createDatasetAssetSources = (config: SourceOptions, client: SanityClient) => {
  const fileSource = createDatasetFileAssetSource({
    client,
    title: config.title || config.name,
  })

  const imageSource = createDatasetImageAssetSource({
    client,
    title: config.title || config.name,
  })

  return {fileSource, imageSource}
}

/**
 * Takes in a config (created from the `defineConfig` function) and returns
 * an array of `WorkspaceSummary`. Note: this only partially resolves a config.
 *
 * For usage inside the Studio, it's preferred to pull the pre-resolved
 * workspaces and sources via `useWorkspace` or `useSource`. For usage outside
 * the Studio or for testing, use `resolveConfig`.
 *
 * @internal
 */
export function prepareConfig(
  config: Config | MissingConfigFile,
  options?: {basePath?: string},
): PreparedConfig {
  if (!Array.isArray(config) && 'missingConfigFile' in config) {
    throw new ConfigResolutionError({
      name: '',
      type: 'configuration file',
      causes: ['No `sanity.config.ts` file found', 'No `sanity.config.js` file found'],
    })
  }

  const rootPath = getRootPath(options?.basePath)
  const workspaceOptions: WorkspaceOptions[] | [SingleWorkspace] = Array.isArray(config)
    ? config
    : [{...config, name: config.name ?? 'default'}]

  try {
    validateWorkspaces({workspaces: workspaceOptions})
  } catch (e) {
    throw new ConfigResolutionError({
      name: '',
      type: 'workspace',
      causes: [e.message],
    })
  }

  const workspaces = workspaceOptions.map((rawWorkspace): WorkspaceSummary => {
    if (preparedWorkspaces.has(rawWorkspace)) {
      return preparedWorkspaces.get(rawWorkspace)!
    }
    const defaultPluginsOptions = getDefaultPluginsOptions(rawWorkspace)

    const {unstable_sources: nestedSources = [], ...rootSource} = rawWorkspace
    const sources = [rootSource as SourceOptions, ...nestedSources].map(({plugins, ...source}) => {
      return {
        ...source,
        plugins: [...(plugins ?? []), ...getDefaultPlugins(defaultPluginsOptions, plugins)]
          /*
           * @FIXME: with the introduction of global references, @sanity/assist broke
           * As a quickfix the plugins was released with a know property on the plugin definition.
           * This checks for that property: if it is missing, the plugin is not compatible with this version of the studio.
           * This ensures auto updating studios can start, albeit without assist, it it is old.
           */
          .filter((plugin) => {
            const validPlugin =
              plugin.name !== '@sanity/assist' ||
              (plugin as unknown as {handlesGDR?: boolean}).handlesGDR
            if (!validPlugin) {
              console.warn(
                'Found an incompatible version of @sanity/assist plugin. It has been disabled.\n' +
                  'To re-enable the plugin, please upgrade to https://github.com/sanity-io/assist/releases/tag/v3.2.2 or later.',
              )
            }

            return validPlugin
          }),
      }
    })

    const resolvedSources = sources.map((source): InternalSource => {
      const {projectId, dataset} = source

      let schemaTypes
      try {
        schemaTypes = resolveSchemaTypes({
          config: source,
          context: {projectId, dataset},
        })
      } catch (e) {
        throw new ConfigResolutionError({
          name: source.name,
          type: 'source',
          causes: [e],
        })
      }

      const schema = createSchema({
        name: source.name,
        types: schemaTypes,
      })

      const schemaValidationProblemGroups = schema._validation
      const schemaErrors = schemaValidationProblemGroups?.filter((msg) =>
        msg.problems.some(isError),
      )

      if (schemaValidationProblemGroups && schemaErrors?.length) {
        // TODO: consider using the `ConfigResolutionError`
        throw new SchemaError(schema)
      }

      const auth = getAuthStore(source)
      const i18n = prepareI18n(source)
      const source$ = auth.state.pipe(
        map(({client, authenticated, currentUser}) => {
          return resolveSource({
            config: source,
            client,
            currentUser,
            schema,
            authenticated,
            auth,
            i18n,
          })
        }),
        shareReplay(1),
      )

      return {
        name: source.name,
        projectId: source.projectId,
        dataset: source.dataset,
        title: source.title || startCase(source.name),
        auth,
        schema,
        i18n: i18n.source,
        source: source$,
      }
    })

    const title = rootSource.title || startCase(rootSource.name)

    const workspaceSummary: WorkspaceSummary = {
      type: 'workspace-summary',
      auth: resolvedSources[0].auth,
      basePath: joinBasePath(rootPath, rootSource.basePath),
      dataset: rootSource.dataset,
      schema: resolvedSources[0].schema,
      i18n: resolvedSources[0].i18n,
      customIcon: !!rootSource.icon,
      icon: normalizeIcon(rootSource.icon, title, `${rootSource.projectId} ${rootSource.dataset}`),
      name: rootSource.name || 'default',
      projectId: rootSource.projectId,
      theme: rootSource.theme || studioTheme,
      title,
      subtitle: rootSource.subtitle,
      __internal: {
        sources: resolvedSources,
      },
      ...defaultPluginsOptions,
    }
    preparedWorkspaces.set(rawWorkspace, workspaceSummary)
    return workspaceSummary
  })

  return {type: 'prepared-config', workspaces}
}

function getAuthStore(source: SourceOptions): AuthStore {
  if (isAuthStore(source.auth)) {
    return source.auth
  }

  const clientFactory = source.unstable_clientFactory || createClient
  const {projectId, dataset, apiHost} = source
  return createAuthStore({apiHost, ...source.auth, clientFactory, dataset, projectId})
}

interface ResolveSourceOptions {
  config: SourceOptions
  schema: Schema
  client: SanityClient
  currentUser: CurrentUser | null
  authenticated: boolean
  auth: AuthStore
  i18n: {i18next: i18n; source: LocaleSource}
}

function getBifurClient(client: SanityClient, auth: AuthStore) {
  const bifurVersionedClient = client.withConfig({apiVersion: '2022-06-30'})
  const {dataset, url: baseUrl, requestTagPrefix = 'sanity.studio'} = bifurVersionedClient.config()
  const url = `${baseUrl.replace(/\/+$/, '')}/socket/${dataset}`.replace(/^http/, 'ws')
  const urlWithTag = `${url}?tag=${requestTagPrefix}`

  const options = auth.token ? {token$: auth.token} : {}
  return fromUrl(urlWithTag, options)
}

function resolveSource({
  config,
  client,
  currentUser,
  schema,
  authenticated,
  auth,
  i18n,
}: ResolveSourceOptions): Source {
  const {dataset, projectId} = config
  const bifur = getBifurClient(client, auth)
  const errors: unknown[] = []
  const clients: Record<string, SanityClient> = {}
  const getClient = (options: SourceClientOptions): SanityClient => {
    if (!options || !options.apiVersion) {
      throw new Error('Missing required `apiVersion` option')
    }

    if (!clients[options.apiVersion]) {
      clients[options.apiVersion] = client.withConfig(options)
    }

    return clients[options.apiVersion]
  }

  const context: ConfigContext & {client: SanityClient} = {
    client,
    getClient,
    currentUser,
    dataset,
    projectId,
    schema,
    i18n: i18n.source,
  }

  // <TEMPORARY UGLY HACK TO PRINT DEPRECATION WARNINGS ON USE>
  /* eslint-disable no-proto */
  const wrappedClient = client as any
  context.client = [...Object.keys(client), ...Object.keys(wrappedClient.__proto__)].reduce(
    (acc, key) => {
      const original = Object.hasOwnProperty.call(client, key)
        ? wrappedClient[key]
        : wrappedClient.__proto__[key]

      return Object.defineProperty(acc, key, {
        get() {
          console.warn(
            '`configContext.client` is deprecated and will be removed in the next release! Use `context.getClient({apiVersion: "2021-06-07"})` instead',
          )
          return original
        },
      })
    },
    {},
  ) as any as SanityClient
  /* eslint-enable no-proto */
  // </TEMPORARY UGLY HACK TO PRINT DEPRECATION WARNINGS ON USE>

  const defaultAssetSources = createDatasetAssetSources(config, context.client)
  const mediaLibraryAssetSources = createMediaLibraryAssetSources(config)

  let templates!: Source['templates']
  try {
    templates = resolveConfigProperty({
      config,
      context,
      propertyName: 'schema.templates',
      reducer: schemaTemplatesReducer,
      initialValue: schema
        .getTypeNames()
        .filter((typeName) => !typeName.startsWith('sanity.'))
        .map((typeName) => schema.get(typeName))
        .filter(isNonNullable)
        .filter((schemaType) => schemaType.type?.name === 'document')
        .map((schemaType) => {
          const template: Template = {
            id: schemaType.name,
            schemaType: schemaType.name,
            title: schemaType.title || schemaType.name,
            icon: schemaType.icon,
            value: schemaType.initialValue || {_type: schemaType.name},
          }

          return template
        }),
    })
    // TODO: validate templates
    // TODO: validate that each one has a unique template ID
  } catch (e) {
    throw new ConfigResolutionError({
      name: config.name,
      type: 'source',
      causes: [e],
    })
  }

  let tools!: Source['tools']
  try {
    tools = resolveConfigProperty({
      config,
      context,
      initialValue: [],
      propertyName: 'tools',
      reducer: toolsReducer,
    })
  } catch (e) {
    throw new ConfigResolutionError({
      name: config.name,
      type: 'source',
      causes: [e],
    })
  }

  // In this case we want to throw an error because it is not possible to have
  // a tool with the name "tool" due to logic that happens in the router.
  if (tools.some(({name}) => name === 'tool')) {
    throw new Error('A tool cannot have the name "tool". Please enter a different name.')
  }

  const initialTemplatesResponses = templates
    // filter out the ones with parameters to fill
    .filter((template) => !template.parameters?.length)
    .map(
      (template): TemplateItem => ({
        templateId: template.id,
        description: template.description,
        icon: template.icon,
        title: template.title,
      }),
    )

  const templateMap = templates.reduce((acc, template) => {
    acc.set(template.id, template)
    return acc
  }, new Map<string, Template>())

  // TODO: extract this function
  const resolveNewDocumentOptions: Source['document']['resolveNewDocumentOptions'] = (
    creationContext,
  ) => {
    const {schemaType: schemaTypeName} = creationContext

    const templateResponses = resolveConfigProperty({
      config,
      context: {...context, creationContext},
      initialValue: initialTemplatesResponses,
      propertyName: 'document.resolveNewDocumentOptions',
      reducer: newDocumentOptionsResolver,
    })

    const templateErrors: unknown[] = []

    // TODO: validate template responses
    // ensure there is a matching template per each one
    if (templateErrors.length) {
      throw new ConfigResolutionError({
        name: config.name,
        type: 'source',
        causes: templateErrors,
      })
    }

    return (
      templateResponses
        // take the template responses and transform them into the formal
        // `InitialValueTemplateItem`
        .map((response, index): InitialValueTemplateItem => {
          const template = templateMap.get(response.templateId)
          if (!template) {
            throw new Error(`Could not find template with ID \`${response.templateId}\``)
          }

          const schemaType = schema.get(template.schemaType)

          if (!schemaType) {
            throw new Error(
              `Could not find matching schema type \`${template.schemaType}\` for template \`${template.id}\``,
            )
          }

          const title = response.title || template.title
          // Don't show the type name as subtitle if it's the same as the template name
          const defaultSubtitle = schemaType?.title === title ? undefined : schemaType?.title

          return {
            id: `${response.templateId}-${index}`,
            templateId: response.templateId,
            type: 'initialValueTemplateItem',
            title,
            i18n: response.i18n || template.i18n,
            subtitle: response.subtitle || defaultSubtitle,
            description: response.description || template.description,
            icon: response.icon || template.icon || schemaType?.icon,
            initialDocumentId: response.initialDocumentId,
            parameters: response.parameters,
            schemaType: template.schemaType,
          }
        })
        .filter((item) => {
          // if we are in a creationContext where there is no schema type,
          // then keep everything
          if (!schemaTypeName) return true

          // If we are in a 'document' creationContext then keep everything
          if (creationContext.type === 'document') return true

          // else only keep the `schemaType`s that match the creationContext
          return schemaTypeName === templateMap.get(item.templateId)?.schemaType
        })
    )
  }

  let staticInitialValueTemplateItems!: InitialValueTemplateItem[]
  try {
    staticInitialValueTemplateItems = resolveNewDocumentOptions({type: 'global'})
  } catch (e) {
    errors.push(e)
  }

  if (errors.length) {
    throw new ConfigResolutionError({
      name: config.name,
      type: 'source',
      causes: errors,
    })
  }

  const source: Source = {
    type: 'source',
    name: config.name,
    title: config.title || startCase(config.name),
    schema,
    getClient,
    dataset,
    projectId,
    tools,
    currentUser,
    authenticated,
    templates,
    auth,
    i18n: i18n.source,
    // eslint-disable-next-line camelcase
    __internal_tasks: internalTasksReducer({
      config,
    }),
    document: {
      actions: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: initialDocumentActions,
          propertyName: 'document.actions',
          reducer: documentActionsReducer,
        }),
      badges: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: initialDocumentBadges,
          propertyName: 'document.badges',
          reducer: documentBadgesReducer,
        }),
      drafts: {
        enabled: resolveConfigProperty({
          config,
          context,
          reducer: draftsEnabledReducer,
          propertyName: 'document.drafts.enabled',
          initialValue: true,
        }),
      },
      unstable_fieldActions: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: initialDocumentFieldActions,
          propertyName: 'document.unstable_fieldActions',
          reducer: documentFieldActionsReducer,
        }),
      inspectors: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: EMPTY_ARRAY,
          propertyName: 'document.inspectors',
          reducer: documentInspectorsReducer,
        }),
      resolveProductionUrl: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: undefined,
          propertyName: 'resolveProductionUrl',
          asyncReducer: resolveProductionUrlReducer,
        }),
      resolveNewDocumentOptions,
      unstable_languageFilter: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {...context, ...partialContext},
          initialValue: initialLanguageFilter,
          propertyName: 'document.unstable_languageFilter',
          reducer: documentLanguageFilterReducer,
        }),
      /** @todo this is deprecated so it will eventually be removed */
      unstable_comments: {
        enabled: (partialContext) => {
          return documentCommentsEnabledReducer({
            context: partialContext,
            config,
            initialValue: true,
          })
        },
      },
      comments: {
        enabled: (partialContext) => {
          return documentCommentsEnabledReducer({
            context: partialContext,
            config,
            initialValue: true,
          })
        },
      },
    },

    form: {
      file: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: mediaLibraryAssetSources.fileSource
            ? [mediaLibraryAssetSources.fileSource, defaultAssetSources.fileSource]
            : [defaultAssetSources.fileSource],
          propertyName: 'formBuilder.file.assetSources',
          reducer: fileAssetSourceResolver,
        }),
        directUploads: directUploadsReducer({config, schemaTypeName: 'file'}),
      },
      image: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: mediaLibraryAssetSources.imageSource
            ? [mediaLibraryAssetSources.imageSource, defaultAssetSources.imageSource]
            : [defaultAssetSources.imageSource],
          propertyName: 'formBuilder.image.assetSources',
          reducer: imageAssetSourceResolver,
        }),
        directUploads: directUploadsReducer({config, schemaTypeName: 'image'}),
      },
    },

    search: {
      filters: filterDefinitions,
      operators: operatorDefinitions,
      unstable_partialIndexing: {
        enabled: partialIndexingEnabledReducer({
          config,
          initialValue: config.search?.unstable_partialIndexing?.enabled ?? false,
        }),
      },
      strategy: searchStrategyReducer({
        config,
        initialValue: 'groqLegacy',
      }),
      enableLegacySearch: resolveConfigProperty({
        config,
        context,
        reducer: legacySearchEnabledReducer,
        propertyName: 'enableLegacySearch',
        initialValue: true,
      }),
      // we will use this when we add search config to PluginOptions
      /*filters: resolveConfigProperty({
        config,
        context: context,
        initialValue: filterDefinitions,
        propertyName: 'search.filters',
        reducer: searchFilterReducer,
      }),
      operators: resolveConfigProperty({
        config,
        context: context,
        initialValue: operatorDefinitions as SearchOperatorDefinition[],
        propertyName: 'search.operators',
        reducer: searchOperatorsReducer,
      }),*/
    },

    __internal: {
      bifur,
      i18next: i18n.i18next,
      staticInitialValueTemplateItems,
      options: config,
      schemaDescriptorId: authenticated
        ? catchTap(uploadSchema(schema, getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)), (err) => {
            debug('Uploading schema failed', {err})
            return undefined
          })
        : Promise.resolve(undefined),
    },
    onUncaughtError: (error: Error, errorInfo: ErrorInfo) => {
      return onUncaughtErrorResolver({
        config,
        context: {
          error: error,
          errorInfo: errorInfo,
        },
      })
    },

    beta: {
      eventsAPI: {
        documents: eventsAPIReducer({config, initialValue: true, key: 'documents'}),
        releases: eventsAPIReducer({config, initialValue: false, key: 'releases'}),
      },
      treeArrayEditing: {
        // This beta feature is no longer available.
        enabled: false,
      },
      create: {
        startInCreateEnabled: false,
        fallbackStudioOrigin: undefined,
      },
    },
    // eslint-disable-next-line camelcase
    __internal_serverDocumentActions: {
      enabled: serverDocumentActionsReducer({config, initialValue: undefined}),
    },

    announcements: {
      enabled: announcementsEnabledReducer({config, initialValue: true}),
    },

    mediaLibrary: {
      enabled: mediaLibraryEnabledReducer({config, initialValue: false}),
      libraryId: mediaLibraryLibraryIdReducer({config, initialValue: undefined}),
    },
  }

  return source
}

/**
 * Validate and normalize the `basePath` option.
 * The root path will be used to prepend workspace-specific base paths.
 * For instance, a `/studio` root path is joined with `/design` to become `/studio/design`.
 *
 * @param basePath - The base path to validate. If not set, an empty string will be returned.
 * @returns A normalized string
 * @throws ConfigResolutionError if the basePath is invalid
 * @internal
 */
function getRootPath(basePath?: string) {
  const rootPath = basePath || ''
  if (typeof rootPath !== 'string' || (rootPath.length > 0 && !rootPath.startsWith('/'))) {
    throw new ConfigResolutionError({
      name: '',
      type: 'options',
      causes: ['basePath must be a string, and must start with a slash'],
    })
  }

  // Since we'll be appending other base paths, we don't want to end up with double slashes
  return rootPath === '/' ? '' : rootPath
}

/**
 * Join the root path of the studio with a workspace base path
 *
 * @param rootPath - The root path to prepend to the base path
 * @param basePath - The base path of the workspace (can be empty)
 * @returns A normalized and joined, complete base path for a workspace
 * @internal
 */
function joinBasePath(rootPath: string, basePath?: string) {
  const joined = [rootPath, basePath || '']
    // Remove leading/trailing slashes
    .map((path) => path.replace(/^\/+/g, '').replace(/\/+$/g, ''))
    // Remove empty segments
    .filter(Boolean)
    // Join the segments
    .join('/')

  return `/${joined}`
}

/**
 * Registers a catch to a promise (to prevent it from being caught by the
 * "unhandled promise" handler) while returning the original promise.
 */
function catchTap<T>(promise: Promise<T>, cb: (reason: unknown) => void): Promise<T> {
  promise.catch(cb)
  return promise
}
