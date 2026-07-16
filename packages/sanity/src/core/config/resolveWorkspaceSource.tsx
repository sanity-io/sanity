import {type SanityClient} from '@sanity/client'
import {type CurrentUser, type Schema, type SchemaValidationProblem} from '@sanity/types'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type i18n} from 'i18next'
import startCase from 'lodash-es/startCase.js'
import {createDebug} from 'obug'
import {type ErrorInfo} from 'react'
import {type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {isDev} from '../environment'
import {
  createDatasetFileAssetSource,
  createDatasetImageAssetSource,
} from '../form/studio/assetSourceDataset'
import {
  createFederatedSanityMediaLibraryFileSource,
  createFederatedSanityMediaLibraryImageSource,
  createIframeSanityMediaLibraryFileSource,
  createIframeSanityMediaLibraryImageSource,
} from '../form/studio/assetSourceMediaLibrary'
import {type MediaLibraryAssetSourceIframeResolution} from '../form/studio/assetSourceMediaLibrary/__telemetry__/mediaLibraryAssetSource.telemetry'
import {
  createFederatedAssetSource,
  discoverFederatedAssetSourceViews,
  type FederatedAssetSourceDiscovery,
  isMediaLibraryView,
} from '../form/studio/federatedAssetSource'
import {type LocaleSource} from '../i18n/types'
import {attributeListeners} from '../network/listenerCountWarning'
import {createSchema} from '../schema/createSchema'
import {type AuthStore} from '../store/auth/types'
import {filterDefinitions} from '../studio/components/navbar/search/definitions/defaultFilters'
import {operatorDefinitions} from '../studio/components/navbar/search/definitions/operators/defaultOperators'
import {fetchCanDeployStudio} from '../studio/manifest/canDeployStudio'
import {uploadSchema} from '../studio/manifest/uploadSchema'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {
  type InitialValueTemplateItem,
  type ResolvedTemplate,
  type Template,
  type TemplateItem,
} from '../templates/types'
import {getPublishedId, isPublishedId} from '../util/draftUtils'
import {EMPTY_ARRAY} from '../util/empty'
import {isNonNullable} from '../util/isNonNullable'
import {
  type StructureNodeIdValidationResult,
  validateStructureNodeId,
} from '../util/validateStructureNodeId'
import {
  advancedVersionControlEnabledReducer,
  announcementsEnabledReducer,
  collapseArrayItemsReducer,
  directUploadsReducer,
  documentActionsReducer,
  documentAskToEditEnabledReducer,
  documentBadgesReducer,
  documentCommentsEnabledReducer,
  documentGroupInventoryEnabledReducer,
  documentInspectorsReducer,
  documentLanguageFilterReducer,
  draftsEnabledReducer,
  eventsAPIReducer,
  fileAssetSourceResolver,
  imageAssetSourceResolver,
  initialCollapseArrayItems,
  initialDocumentActions,
  initialDocumentBadges,
  initialLanguageFilter,
  federatedAssetSourcesReducer,
  mediaLibraryEnabledReducer,
  mediaLibraryFederatedAssetSourceReducer,
  mediaLibraryFrontendHostReducer,
  mediaLibraryLibraryIdReducer,
  newDocumentOptionsResolver,
  onUncaughtErrorResolver,
  partialIndexingEnabledReducer,
  releaseBackgroundListenersEnabledReducer,
  reactActivityModeEnabledReducer,
  releaseActionsReducer,
  resolveProductionUrlReducer,
  scheduledDraftsEnabledReducer,
  schemaTemplatesReducer,
  searchStrategyReducer,
  singletonsReducer,
  toolsReducer,
  variantsTypesReducer,
  variantsEnabledReducer,
} from './configPropertyReducers'
import {ConfigResolutionError} from './ConfigResolutionError'
import {createBifurClient} from './createBifurClient'
import {type DefaultPluginsOptions} from './defaultPluginsOptions'
import {initialDocumentFieldActions} from './document/fieldActions'
import {documentFieldActionsReducer} from './document/fieldActions/reducer'
import {resolveConfigProperty} from './resolveConfigProperty'
import {getDefaultPlugins} from './resolveDefaultPlugins'
import {resolveSchemaTypes} from './resolveSchemaTypes'
import {SchemaError} from './SchemaError'
import {
  type BetaFeatures,
  type ConfigContext,
  type PluginOptions,
  type ReleaseMetadataConfig,
  type SingletonDefinition,
  type Source,
  type SourceClientOptions,
  type SourceOptions,
} from './types'

const debug = createDebug('sanity:config')

const isBrowser = typeof window === 'object'

const isError = (p: SchemaValidationProblem) => p.severity === 'error'

let hasWarnedAboutDeprecatedConfigContextClient = false

function warnDeprecatedConfigContextClientOnce() {
  if (hasWarnedAboutDeprecatedConfigContextClient) return
  hasWarnedAboutDeprecatedConfigContextClient = true
  console.warn(
    '`configContext.client` is deprecated and will be removed in the next release! Use `context.getClient({apiVersion: "2021-06-07"})` instead',
  )
}

// The iframe fallback is legitimate (cold start, non-dashboard studio, org
// without a brokered view) but easy to mistake for the federated view since
// both render the full Media Library UI. Announce it once so a dev session
// that silently degraded is diagnosable from the console.
let notifiedFederatedFallback = false
const notifyFederatedFallbackOnce = (reason: string) => {
  if (notifiedFederatedFallback) return
  notifiedFederatedFallback = true
  // oxlint-disable-next-line no-console -- intentional one-shot diagnostic
  console.info(
    `[sanity] Media Library federated asset source unavailable (${reason}); ` +
      'falling back to the iframe select dialog. In a dashboard dev session ' +
      'this usually means the studio booted before the Media Library dev ' +
      'server registered — reload once all dev servers are up.',
  )
}

// Create media library sources with configuration
const createMediaLibraryAssetSources = (config: PluginOptions) => {
  const libraryId = mediaLibraryLibraryIdReducer({config, initialValue: undefined})
  const enabled = mediaLibraryEnabledReducer({config, initialValue: false})
  // Default-on: an enabled Media Library automatically uses the federated
  // view where one is brokered; the internal flag remains as an opt-out.
  const federated = mediaLibraryFederatedAssetSourceReducer({config, initialValue: true})
  // Third-party brokered views have their own gate (`federatedAssetSources`),
  // decoupled from the Media Library's internal rollout flag.
  const federatedSourcesConfig = federatedAssetSourcesReducer({config, initialValue: undefined})
  const brokeredSourcesEnabled = federatedSourcesConfig?.enabled === true

  // The `asset_source` views brokered over the workbench message bus, read
  // synchronously since sources are resolved once here. Outside the
  // workbench, or on a cold start in which the workbench has not published
  // its application list yet, there are none — either way every brokered
  // source is simply absent and the Media Library keeps its iframe dialog, so
  // the race can never cost the Media Library source itself. Only consult
  // the bus when a source could use the result — with `federated` defaulting
  // on, reading it unconditionally would open a message-bus connection in
  // every workspace, Media Library or not.
  const discovery =
    (federated && enabled) || brokeredSourcesEnabled
      ? discoverFederatedAssetSourceViews()
      : undefined
  const brokeredViews = discovery?.status === 'published' ? discovery.views : []

  // The Media Library's own view replaces the select dialog of the built-in
  // source below; views from other applications become their own sources.
  const mediaLibraryView = federated ? brokeredViews.find(isMediaLibraryView) : undefined

  // Outside the workbench the iframe dialog is the normal path, not a
  // degraded one — stay quiet there.
  if (
    federated &&
    enabled &&
    !mediaLibraryView &&
    discovery !== undefined &&
    discovery.status !== 'standalone'
  ) {
    notifyFederatedFallbackOnce(
      'no Media Library asset_source view in the brokered application list',
    )
  }
  const viewFilter = federatedSourcesConfig?.filter
  const viewUploads = federatedSourcesConfig?.uploads
  const federatedSources = brokeredSourcesEnabled
    ? brokeredViews
        .filter((view) => !isMediaLibraryView(view))
        .map((view) => ({
          view,
          info: {
            applicationId: view.applicationId,
            applicationName: view.applicationName,
            applicationTitle: view.applicationTitle,
            name: view.name,
            title: view.title,
          },
        }))
        .filter(({info}) => (viewFilter ? viewFilter(info) : true))
        .map(({view, info}) =>
          createFederatedAssetSource(view, {uploads: viewUploads ? viewUploads(info) : false}),
        )
    : []

  // Only create Media Library sources if the media library is enabled
  if (!enabled) {
    return {fileSource: null, imageSource: null, federatedSources}
  }

  if (mediaLibraryView) {
    return {
      fileSource: createFederatedSanityMediaLibraryFileSource({
        libraryId: libraryId || null,
        view: mediaLibraryView,
      }),
      imageSource: createFederatedSanityMediaLibraryImageSource({
        libraryId: libraryId || null,
        view: mediaLibraryView,
      }),
      federatedSources,
    }
  }

  const resolution = resolveIframeResolution(federated, discovery)
  return {
    fileSource: createIframeSanityMediaLibraryFileSource({
      libraryId: libraryId || null,
      resolution,
    }),
    imageSource: createIframeSanityMediaLibraryImageSource({
      libraryId: libraryId || null,
      resolution,
    }),
    federatedSources,
  }
}

/** Why the Media Library source uses the iframe, reported when it opens. */
function resolveIframeResolution(
  federated: boolean,
  discovery: FederatedAssetSourceDiscovery | undefined,
): MediaLibraryAssetSourceIframeResolution {
  if (!federated) return {outcome: 'iframe_opt_out', reason: null}
  switch (discovery?.status) {
    case 'pending':
      return {outcome: 'iframe_fallback', reason: 'cold_start'}
    case 'failed':
      return {outcome: 'iframe_fallback', reason: 'applications_list_failed'}
    case 'published':
      return {outcome: 'iframe_fallback', reason: 'no_view'}
    default:
      return {outcome: 'iframe_unsupported', reason: 'standalone_studio'}
  }
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
 * Compiles the schema of a source, with the default plugins, and resolves the
 * source each time the auth state changes. Loaded on demand by `prepareConfig`,
 * so the default plugins, the schema compiler and the form code stay out of the
 * code a studio loads before login.
 *
 * @internal
 */
export function resolveWorkspaceSource({
  config: sourceOptions,
  declaredPlugins,
  sourceIndex,
  workspaceName,
  defaultPluginsOptions,
  auth,
  i18n,
}: {
  /** The source options, with the compatible plugins the user declared. */
  config: SourceOptions
  /** The plugins the user declared, as written in the config. */
  declaredPlugins: PluginOptions[] | undefined
  sourceIndex: number
  workspaceName: string
  defaultPluginsOptions: DefaultPluginsOptions
  auth: AuthStore
  i18n: {i18next: i18n; source: LocaleSource}
}): Observable<Source> {
  const config: SourceOptions = {
    ...sourceOptions,
    plugins: [
      ...(sourceOptions.plugins ?? []),
      ...getDefaultPlugins(defaultPluginsOptions, declaredPlugins),
    ],
  }
  const {projectId, dataset} = config

  let schemaTypes
  try {
    schemaTypes = resolveSchemaTypes({
      config,
      context: {projectId, dataset},
    })
  } catch (e) {
    throw new ConfigResolutionError({
      name: config.name,
      type: 'source',
      causes: [e],
    })
  }

  const schema = createSchema({
    name: config.name,
    types: schemaTypes,
  })

  const schemaValidationProblemGroups = schema._validation
  const schemaErrors = schemaValidationProblemGroups?.filter((msg) => msg.problems.some(isError))

  if (schemaValidationProblemGroups && schemaErrors?.length) {
    // TODO: consider using the `ConfigResolutionError`
    throw new SchemaError(schema, {
      workspaceName,
      sourceName: sourceIndex === 0 ? undefined : config.name || 'default',
      projectId,
      dataset,
    })
  }

  return auth.state.pipe(
    map(({client, authenticated, currentUser}) =>
      resolveSource({
        config,
        client,
        currentUser,
        schema,
        authenticated,
        auth,
        i18n,
        releaseMetadata: defaultPluginsOptions.releases.metadata ?? {},
      }),
    ),
  )
}

interface ResolveSourceOptions {
  config: SourceOptions
  schema: Schema
  client: SanityClient
  currentUser: CurrentUser | null
  authenticated: boolean
  auth: AuthStore
  i18n: {i18next: i18n; source: LocaleSource}
  /** Resolved once per workspace, with the default plugins options. */
  releaseMetadata: ReleaseMetadataConfig
}

function resolveSource({
  config,
  client,
  currentUser,
  schema,
  authenticated,
  auth,
  i18n,
  releaseMetadata,
}: ResolveSourceOptions): Source {
  const {dataset, projectId} = config
  const bifur = createBifurClient(client, auth.token)
  const errors: unknown[] = []
  const clients: Record<string, SanityClient> = {}
  const getClient = (options: SourceClientOptions): SanityClient => {
    if (!options || !options.apiVersion) {
      throw new Error('Missing required `apiVersion` option')
    }

    if (!clients[options.apiVersion]) {
      const versionedClient = client.withConfig(options)
      clients[options.apiVersion] =
        isDev && isBrowser ? attributeListeners(versionedClient) : versionedClient
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
  const wrappedClient = client as any
  context.client = [...Object.keys(client), ...Object.keys(wrappedClient.__proto__)].reduce(
    (acc, key) => {
      const original = Object.hasOwnProperty.call(client, key)
        ? wrappedClient[key]
        : wrappedClient.__proto__[key]

      return Object.defineProperty(acc, key, {
        get() {
          warnDeprecatedConfigContextClientOnce()
          return original
        },
      })
    },
    {},
  ) as any as SanityClient
  // </TEMPORARY UGLY HACK TO PRINT DEPRECATION WARNINGS ON USE>

  const defaultAssetSources = createDatasetAssetSources(config, client)
  const mediaLibraryAssetSources = createMediaLibraryAssetSources(config)

  let singletons: SingletonDefinition[] = []

  try {
    singletons = resolveConfigProperty({
      config,
      context,
      initialValue: [],
      propertyName: 'document.singletons',
      reducer: singletonsReducer,
    })
  } catch (error) {
    errors.push(error)
  }

  const singletonOnlySchemaTypeNames = getSingletonOnlySchemaTypeNames(singletons)

  validateSingletons(singletons, singletonOnlySchemaTypeNames, schema, errors)

  const singletonsByDocumentId = new Map(
    singletons.map((singleton) => [singleton.documentId, singleton]),
  )

  const getSingletonId = (
    documentId: string | undefined,
    schemaTypeName: string | undefined,
  ): string | undefined => {
    if (!documentId) {
      return undefined
    }

    const definition = singletonsByDocumentId.get(getPublishedId(documentId))

    if (!definition) {
      return undefined
    }

    if (schemaTypeName && definition.schemaType !== schemaTypeName) {
      if (isDev) {
        console.warn(
          `Document "${documentId}" matches the document id of singleton "${definition.id}", ` +
            `but has schema type "${schemaTypeName}" where the singleton expects "${definition.schemaType}". ` +
            `Singleton behaviour will not be applied.`,
        )
      }

      return undefined
    }

    return definition.id
  }

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
        .filter((schemaType) => !singletonOnlySchemaTypeNames.has(schemaType.name))
        .map((schemaType) => {
          const template: Template = {
            id: schemaType.name,
            schemaType: schemaType.name,
            title: schemaType.title || schemaType.name,
            icon: schemaType.icon,
            value: schemaType.initialValue || {_type: schemaType.name},
          }

          return template
        })
        .concat(
          singletons
            .map(
              ({
                schemaType: schemaTypeName,
                id,
                title,
                initialValue,
                icon,
              }): ResolvedTemplate | undefined => {
                const schemaType = schema.get(schemaTypeName)

                if (!schemaType) {
                  return undefined
                }

                return {
                  id,
                  schemaType: schemaTypeName,
                  title: title || schemaType.title || schemaType.name,
                  icon: icon || schemaType.icon,
                  value: initialValue ?? schemaType.initialValue ?? {_type: schemaTypeName},
                  singleton: id,
                }
              },
            )
            .filter(isNonNullable),
        ),
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

  validateSingletonTemplates(templates, singletons, errors)

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
    .filter((template) => template.singleton === undefined)
    .map((template): TemplateItem => ({
      templateId: template.id,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      description: template.description,
      icon: template.icon,
      title: template.title,
    }))

  const templateMap = templates.reduce((acc, template) => {
    acc.set(template.id, template)
    return acc
  }, new Map<string, ResolvedTemplate>())

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
        // `document.newDocumentOptions` reducers may re-add singleton templates
        // by id, so the filter applied to their initial value is not sufficient.
        .filter((response) => templateMap.get(response.templateId)?.singleton === undefined)
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
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
            subtitle: response.subtitle || defaultSubtitle,
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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

  const variantsEnabled = variantsEnabledReducer({config, initialValue: false})

  const beta: BetaFeatures = {
    eventsAPI: {
      // oxlint-disable-next-line no-deprecated -- always `true` for code that still reads the resolved flag
      documents: true,
      releases: eventsAPIReducer({config, initialValue: false, key: 'releases'}),
    },
    variants: {
      enabled: variantsEnabled,
      types: variantsTypesReducer({config, initialValue: undefined}),
    },
    documentGroupInventory: {
      // The document group inventory is an inherent part of the variants experience.
      // It cannot be switched off while variants are switched on.
      enabled:
        documentGroupInventoryEnabledReducer({config, initialValue: false}) || variantsEnabled,
    },
    releaseBackgroundListeners: {
      enabled: releaseBackgroundListenersEnabledReducer({config, initialValue: false}),
    },
  }

  const reactActivityMode = {
    enabled: reactActivityModeEnabledReducer({config, initialValue: true}),
  }

  // Upload the schema descriptor to Content Lake, but only when the user is
  // authenticated and actually holds the `deployStudio` grant. Checking the
  // grant first avoids firing a POST that would 403 for users without it.
  const schemaDescriptorId: Promise<string | undefined> = authenticated
    ? (async () => {
        const studioClient = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
        if (!(await fetchCanDeployStudio(studioClient))) {
          debug('Skipping schema upload: user lacks the deployStudio grant')
          return undefined
        }
        return uploadSchema(schema, studioClient)
      })().catch((err) => {
        // Resolve to `undefined` (rather than rejecting) so consumers awaiting
        // `schemaDescriptorId` don't have to handle a rejection.
        debug('Uploading schema failed', {err})
        return undefined
      })
    : Promise.resolve(undefined)

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
    document: {
      actions: (partialContext) => {
        const singleton = getSingletonId(partialContext.documentId, partialContext.schemaType)
        const resolvedActions = resolveConfigProperty({
          config,
          context: {...context, ...partialContext, singleton},
          initialValue: initialDocumentActions,
          propertyName: 'document.actions',
          reducer: documentActionsReducer,
        })

        if (singleton) {
          return resolvedActions.filter((action) => action.action !== 'duplicate')
        }

        return resolvedActions
      },
      badges: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {
            ...context,
            ...partialContext,
            singleton: getSingletonId(partialContext.documentId, partialContext.schemaType),
          },
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
          context: {
            ...context,
            ...partialContext,
            singleton: getSingletonId(partialContext.documentId, partialContext.documentType),
          },
          initialValue: initialDocumentFieldActions,
          propertyName: 'document.unstable_fieldActions',
          reducer: documentFieldActionsReducer,
        }),
      inspectors: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {
            ...context,
            ...partialContext,
            singleton: getSingletonId(partialContext.documentId, partialContext.documentType),
            beta,
          },
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
      singletons,
      unstable_languageFilter: (partialContext) =>
        resolveConfigProperty({
          config,
          context: {
            ...context,
            ...partialContext,
            singleton: getSingletonId(partialContext.documentId, partialContext.schemaType),
          },
          initialValue: initialLanguageFilter,
          propertyName: 'document.unstable_languageFilter',
          reducer: documentLanguageFilterReducer,
        }),
      comments: {
        enabled: (partialContext) => {
          return documentCommentsEnabledReducer({
            context: {
              ...partialContext,
              singleton: getSingletonId(partialContext.documentId, partialContext.documentType),
            },
            config,
            initialValue: true,
          })
        },
      },
      askToEdit: {
        enabled: (partialContext) => {
          return documentAskToEditEnabledReducer({
            context: {
              ...partialContext,
              singleton: getSingletonId(partialContext.documentId, partialContext.documentType),
            },
            config,
            initialValue: true,
          })
        },
      },
    },

    form: {
      arrays: {
        collapseItems: collapseArrayItemsReducer({
          config,
          initialValue: initialCollapseArrayItems,
        }),
      },
      file: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: [
            ...(mediaLibraryAssetSources.fileSource ? [mediaLibraryAssetSources.fileSource] : []),
            defaultAssetSources.fileSource,
            ...mediaLibraryAssetSources.federatedSources,
          ],
          propertyName: 'formBuilder.file.assetSources',
          reducer: fileAssetSourceResolver,
        }),
        directUploads: directUploadsReducer({config, schemaTypeName: 'file'}),
      },
      image: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: [
            ...(mediaLibraryAssetSources.imageSource ? [mediaLibraryAssetSources.imageSource] : []),
            defaultAssetSources.imageSource,
            ...mediaLibraryAssetSources.federatedSources,
          ],
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
        initialValue: 'groq2024',
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
      schemaDescriptorId,
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

    beta,

    reactActivityMode,

    announcements: {
      enabled: announcementsEnabledReducer({config, initialValue: true}),
    },

    mediaLibrary: {
      enabled: mediaLibraryEnabledReducer({config, initialValue: false}),
      libraryId: mediaLibraryLibraryIdReducer({config, initialValue: undefined}),
      __internal: {
        frontendHost: mediaLibraryFrontendHostReducer({config, initialValue: undefined}),
        federatedAssetSource: mediaLibraryFederatedAssetSourceReducer({
          config,
          initialValue: true,
        }),
      },
    },

    advancedVersionControl: {
      enabled: resolveConfigProperty({
        config,
        context,
        reducer: advancedVersionControlEnabledReducer,
        propertyName: 'advancedVersionControl.enabled',
        initialValue: false,
      }),
    },
    scheduledDrafts: {
      enabled: scheduledDraftsEnabledReducer({config, initialValue: true}),
    },

    releases: config.releases
      ? {
          enabled: config.releases.enabled ?? true,
          limit: config.releases.limit,
          actions: (partialContext) =>
            resolveConfigProperty({
              config,
              context: {...context, ...partialContext},
              initialValue: [],
              propertyName: 'releases.actions',
              reducer: releaseActionsReducer,
            }),
          metadata: releaseMetadata,
        }
      : {enabled: true, metadata: releaseMetadata},
  }

  return source
}

/**
 * Returns the names of the schema types used exclusively for singletons: those
 * claimed by at least one singleton definition, none of which sets
 * `allowNonSingletonDocuments`. These types get no plain per-type template and
 * are hidden from the default document type lists.
 */
function getSingletonOnlySchemaTypeNames(singletons: SingletonDefinition[]): Set<string> {
  const allowsNonSingletonDocuments = new Set(
    singletons
      .filter((singleton) => singleton.allowNonSingletonDocuments)
      .map((singleton) => singleton.schemaType),
  )

  return new Set(
    singletons
      .map((singleton) => singleton.schemaType)
      .filter((schemaType) => !allowsNonSingletonDocuments.has(schemaType)),
  )
}

/**
 * Validates the resolved singleton definitions, pushing every problem onto the
 * shared `errors` array.
 */
function validateSingletons(
  singletons: SingletonDefinition[],
  singletonOnlySchemaTypeNames: ReadonlySet<string>,
  schema: Schema,
  errors: unknown[],
): void {
  const validations = singletons.map((singleton) => ({
    singleton,
    idError: getSingletonIdError(singleton),
    documentIdError: getSingletonDocumentIdError(singleton),
    schemaTypeError: getSingletonSchemaTypeError(singleton, schema),
  }))

  errors.push(
    ...validations.flatMap(({idError, documentIdError, schemaTypeError}) =>
      [idError, documentIdError, schemaTypeError].filter((error) => error !== undefined),
    ),
  )

  const ids = validations
    .filter(({idError}) => idError === undefined)
    .map(({singleton}) => singleton.id)

  const documentIds = validations
    .filter(({documentIdError}) => documentIdError === undefined)
    .map(({singleton}) => singleton.documentId)

  const duplicateIds = findDuplicates(ids)

  if (duplicateIds.length > 0) {
    errors.push(
      new Error(
        `Duplicate singleton definition ids found: ${duplicateIds.join(', ')}. ` +
          `Each singleton \`id\` must be unique.`,
      ),
    )
  }

  const duplicateDocumentIds = findDuplicates(documentIds)

  if (duplicateDocumentIds.length > 0) {
    errors.push(
      new Error(
        `Multiple singleton definitions use the same document id: ${duplicateDocumentIds.join(', ')}. ` +
          `Each singleton \`documentId\` must be unique.`,
      ),
    )
  }

  const typeNameCollisions = [...new Set(ids)].filter(
    (id) => !singletonOnlySchemaTypeNames.has(id) && schema.get(id)?.type?.name === 'document',
  )

  if (typeNameCollisions.length !== 0) {
    errors.push(
      new Error(
        `Singleton definition ids collide with document type names: ${typeNameCollisions.join(', ')}. ` +
          `Those document types appear in the default content list alongside the singletons, ` +
          `where ids must be unique. Rename the singleton \`id\`.`,
      ),
    )
  }
}

/**
 * Returns an error describing why the template conflicts with the singleton
 * registry, or `undefined` if it does not.
 */
function getTemplateSingletonError(
  {id, singleton}: ResolvedTemplate,
  definitionIds: ReadonlySet<string>,
): Error | undefined {
  if (typeof singleton === 'undefined') {
    return definitionIds.has(id)
      ? new Error(
          `Template "${id}" reuses the id of singleton definition "${id}". ` +
            `That id is used by the singleton's generated template; use a different template id.`,
        )
      : undefined
  }

  if (!definitionIds.has(singleton)) {
    return new Error(`Template "${id}" represents nonexistent singleton "${singleton}".`)
  }

  return undefined
}

/**
 * Validates the relationship between resolved templates and singleton
 * definitions, pushing every problem onto the shared `errors` array.
 *
 * - A non-singleton template must not match a singleton definition id; the
 *   generated singleton template is given that id.
 * - No more than one template may represent a particular singleton.
 * - If a template represents a singleton, a singleton matching that id must
 *   exist.
 */
function validateSingletonTemplates(
  templates: ResolvedTemplate[],
  singletons: SingletonDefinition[],
  errors: unknown[],
): void {
  const definitionIds = new Set(singletons.map((definition) => definition.id))

  errors.push(
    ...templates
      .map((template) => getTemplateSingletonError(template, definitionIds))
      .filter((error) => error !== undefined),
  )

  const singletonsWithTemplates = templates.flatMap(({singleton}) =>
    singleton !== undefined && definitionIds.has(singleton) ? [singleton] : [],
  )

  const singletonsWithMultipleTemplates = findDuplicates(singletonsWithTemplates)

  if (singletonsWithMultipleTemplates.length > 0) {
    errors.push(
      new Error(
        `Multiple templates represent the same singleton definition id: ${singletonsWithMultipleTemplates.join(', ')}. ` +
          `A singleton can be represented by only a single template.`,
      ),
    )
  }
}

function findDuplicates<Type>(values: Iterable<Type>): Type[] {
  const seen = new Set<Type>()
  const duplicates = new Set<Type>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
      continue
    }

    seen.add(value)
  }

  return [...seen].filter((value) => duplicates.has(value))
}

function getSingletonIdError({id}: SingletonDefinition): Error | undefined {
  if (typeof id !== 'string' || id.length === 0) {
    return new Error(
      `Singleton definitions must have a non-empty string \`id\`, but found ${JSON.stringify(id)}.`,
    )
  }

  const result = validateStructureNodeId(id)

  if (!result.isValid) {
    return new Error(
      `Singleton definition "${id}" has an invalid \`id\`: ${getStructureNodeIdProblem(result)}.`,
    )
  }

  return undefined
}

function getStructureNodeIdProblem(
  result: Exclude<StructureNodeIdValidationResult, {isValid: true}>,
): string {
  switch (result.reason) {
    case 'invalidType':
      return `expected a string, but found ${result.type}`
    case 'disallowedCharacter':
      return `it contains "${result.character}", but Structure Tool node ids may only contain [a-zA-Z0-9._-]`
    case 'reservedPrefix':
      return `it starts with "${result.prefix}", which Structure Tool reserves for its own panes`
    default: {
      const unknownResult: never = result
      throw new Error(
        `Unknown structure node id validation result: ${JSON.stringify(unknownResult)}`,
      )
    }
  }
}

function getSingletonDocumentIdError({id, documentId}: SingletonDefinition): Error | undefined {
  if (typeof documentId !== 'string' || documentId.length === 0) {
    return new Error(
      `Singleton definition "${id}" must have a non-empty string \`documentId\`, but found ${JSON.stringify(documentId)}.`,
    )
  }

  const result = validateStructureNodeId(documentId)
  const hasDisallowedCharacter = !result.isValid && result.reason === 'disallowedCharacter'

  if (!isPublishedId(documentId) || hasDisallowedCharacter) {
    return new Error(
      `Singleton definition "${id}" has invalid \`documentId\` "${documentId}". ` +
        `It must be a document group id (no "drafts." or "versions." prefix) using only [a-zA-Z0-9._-].`,
    )
  }

  return undefined
}

function getSingletonSchemaTypeError(
  {id, schemaType}: SingletonDefinition,
  schema: Schema,
): Error | undefined {
  const resolvedSchemaType = typeof schemaType === 'string' ? schema.get(schemaType) : undefined

  if (!resolvedSchemaType) {
    return new Error(
      `Singleton definition "${id}" references schema type "${schemaType}", which does not exist in the schema.`,
    )
  }

  if (resolvedSchemaType.type?.name !== 'document') {
    return new Error(
      `Singleton definition "${id}" references schema type "${schemaType}", which is not a document type.`,
    )
  }

  return undefined
}
