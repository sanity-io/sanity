import {createClient, type SanityClient} from '@sanity/client'
import {map, shareReplay} from 'rxjs/operators'
import type {CurrentUser, Schema, SchemaValidationProblem} from '@sanity/types'
import {studioTheme} from '@sanity/ui'
import {startCase} from 'lodash'
import {fromUrl} from '@sanity/bifur-client'
import {createElement, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {createSchema} from '../schema'
import {type AuthStore, createAuthStore, isAuthStore} from '../store/_legacy'
import {FileSource, ImageSource} from '../form/studio/assetSource'
import type {InitialValueTemplateItem, Template, TemplateItem} from '../templates'
import {EMPTY_ARRAY, isNonNullable} from '../util'
import {validateWorkspaces} from '../studio'
import {filterDefinitions} from '../studio/components/navbar/search/definitions/defaultFilters'
import {operatorDefinitions} from '../studio/components/navbar/search/definitions/operators/defaultOperators'
import {prepareI18nSource} from '../i18n/i18nConfig'
import type {
  Config,
  I18nSource,
  MissingConfigFile,
  PreparedConfig,
  SingleWorkspace,
  Source,
  SourceClientOptions,
  SourceOptions,
  WorkspaceOptions,
  WorkspaceSummary,
} from './types'
import {
  documentActionsReducer,
  documentBadgesReducer,
  documentInspectorsReducer,
  documentLanguageFilterReducer,
  fileAssetSourceResolver,
  imageAssetSourceResolver,
  initialDocumentActions,
  initialDocumentBadges,
  initialLanguageFilter,
  newDocumentOptionsResolver,
  resolveProductionUrlReducer,
  schemaTemplatesReducer,
  schemaTypesReducer,
  toolsReducer,
} from './configPropertyReducers'
import {resolveConfigProperty} from './resolveConfigProperty'
import {ConfigResolutionError} from './ConfigResolutionError'
import {SchemaError} from './SchemaError'
import {createDefaultIcon} from './createDefaultIcon'
import {documentFieldActionsReducer, initialDocumentFieldActions} from './document'

type InternalSource = WorkspaceSummary['__internal']['sources'][number]

const isError = (p: SchemaValidationProblem) => p.severity === 'error'

function normalizeIcon(
  icon: React.ComponentType | React.ElementType | undefined,
  title: string,
  subtitle = '',
): JSX.Element {
  if (isValidElementType(icon)) return createElement(icon)
  if (isValidElement(icon)) return icon
  return createDefaultIcon(title, subtitle)
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
    : [config]

  try {
    validateWorkspaces({workspaces: workspaceOptions})
  } catch (e) {
    throw new ConfigResolutionError({
      name: '',
      type: 'workspace',
      causes: [e.message],
    })
  }

  const workspaces = workspaceOptions.map(
    ({unstable_sources: nestedSources = [], ...rootSource}): WorkspaceSummary => {
      const sources = [rootSource as SourceOptions, ...nestedSources]

      const resolvedSources = sources.map((source): InternalSource => {
        const {projectId, dataset} = source

        let schemaTypes
        try {
          schemaTypes = resolveConfigProperty({
            propertyName: 'schema.types',
            config: source,
            context: {projectId, dataset},
            initialValue: [],
            reducer: schemaTypesReducer,
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
        const i18n = prepareI18nSource(source, schema)

        const auth = getAuthStore(source)
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
          i18n,
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
        icon: normalizeIcon(
          rootSource.icon,
          title,
          `${rootSource.projectId} ${rootSource.dataset}`,
        ),
        name: rootSource.name || 'default',
        projectId: rootSource.projectId,
        theme: rootSource.theme || studioTheme,
        title,
        subtitle: rootSource.subtitle,
        __internal: {
          sources: resolvedSources,
        },
      }

      return workspaceSummary
    },
  )

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
  i18n: I18nSource
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

  const context = {
    client,
    getClient,
    currentUser,
    dataset,
    projectId,
    schema,
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

  let templates!: Source['templates']
  try {
    templates = resolveConfigProperty({
      config,
      context,
      propertyName: 'schema.templates',
      reducer: schemaTemplatesReducer,
      initialValue: schema
        .getTypeNames()
        .filter((typeName) => !/^sanity\./.test(typeName))
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
    i18n,
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
    },
    form: {
      file: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: [FileSource],
          propertyName: 'formBuilder.file.assetSources',
          reducer: fileAssetSourceResolver,
        }),
        directUploads:
          // TODO: consider refactoring this to `noDirectUploads` or similar
          // default value for this is `true`
          config.form?.file?.directUploads === undefined ? true : config.form.file.directUploads,
      },
      image: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: [ImageSource],
          propertyName: 'formBuilder.image.assetSources',
          reducer: imageAssetSourceResolver,
        }),
        directUploads:
          // TODO: consider refactoring this to `noDirectUploads` or similar
          // default value for this is `true`
          config.form?.image?.directUploads === undefined ? true : config.form.image.directUploads,
      },
    },

    search: {
      filters: filterDefinitions,
      operators: operatorDefinitions,
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
      staticInitialValueTemplateItems,
      options: config,
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
