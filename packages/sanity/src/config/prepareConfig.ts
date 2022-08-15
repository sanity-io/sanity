/* eslint-disable max-nested-callbacks */
import {SanityClient} from '@sanity/client'
import {map, shareReplay} from 'rxjs/operators'
import {CurrentUser, Schema} from '@sanity/types'
import {studioTheme} from '@sanity/ui'
import {startCase} from 'lodash'
import {fromUrl} from '@sanity/bifur-client'
import {createElement, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {createSchema} from '../schema'
import {AuthStore, createAuthStore} from '../datastores'
import {InitialValueTemplateItem, Template, TemplateResponse} from '../templates'
import {isNonNullable} from '../util'
import {defaultFileAssetSources, defaultImageAssetSources} from '../form/defaults'
import {validateWorkspaces} from '../studio/workspaces/validateWorkspaces'
import {
  Source,
  SourceOptions,
  Config,
  WorkspaceSummary,
  PreparedConfig,
  SingleWorkspace,
  WorkspaceOptions,
} from './types'
import {
  _documentLanguageFilterReducer,
  documentActionsReducer,
  documentBadgesReducer,
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
import {_createRenderField} from './form/_renderField'
import {_createRenderInput} from './form/_renderInput'
import {_createRenderItem} from './form/_renderItem'
import {_createRenderPreview} from './form/_renderPreview'

type InternalSource = WorkspaceSummary['__internal']['sources'][number]

function normalizeLogo(
  logo: React.ComponentType | React.ElementType | undefined,
  title: string,
  subtitle = ''
): JSX.Element {
  if (isValidElementType(logo)) return createElement(logo)
  if (isValidElement(logo)) return logo
  return createDefaultIcon(title, subtitle)
}

/**
 * Takes in a config (created from the `createConfig` function) and returns
 * an array of `WorkspaceSummary`. Note: this only partially resolves a config.
 *
 * For usage usage inside of the Studio, it's preferred to pull the pre-resolved
 * workspaces and sources via `useWorkspace` or `useSource`. For usage outside
 * of the Studio or for testing, use `resolveConfig`.
 */
export function prepareConfig(config: Config): PreparedConfig {
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
        const projectId = source.projectId
        const dataset = source.dataset

        const auth = source.auth || createAuthStore({dataset, projectId})

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
          msg.problems.some((p) => p.severity === 'error')
        )

        if (schemaValidationProblemGroups && schemaErrors?.length) {
          // TODO: consider using the `ConfigResolutionError`
          throw new SchemaError(schema)
        }

        const source$ = auth.state.pipe(
          map(({client, authenticated, currentUser}) => {
            return resolveSource({
              config: source,
              client,
              currentUser,
              schema,
              authenticated,
              auth,
            })
          }),
          shareReplay(1)
        )

        return Object.assign(source$, {
          name: source.name,
          projectId: source.projectId,
          dataset: source.dataset,
          title: source.title || startCase(source.name),
          auth,
          schema,
        })
      })

      const title = rootSource.title || startCase(rootSource.name)

      const workspaceSummary: WorkspaceSummary = {
        type: 'workspace-summary',
        auth: resolvedSources[0].auth,
        basePath: rootSource.basePath || '/',
        dataset: rootSource.dataset,
        schema: resolvedSources[0].schema,
        icon: normalizeLogo(
          rootSource.icon,
          title,
          `${rootSource.projectId} ${rootSource.dataset}`
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
    }
  )

  return {type: 'prepared-config', workspaces}
}

interface ResolveSourceOptions {
  config: SourceOptions
  schema: Schema
  client: SanityClient
  currentUser: CurrentUser | null
  authenticated: boolean
  auth: AuthStore
}

function getBifurClient(client: SanityClient, auth: AuthStore) {
  const bifurVersionedClient = client.withConfig({apiVersion: '2022-06-30'})
  const dataset = bifurVersionedClient.config().dataset

  const url = bifurVersionedClient.getUrl(`/socket/${dataset}`).replace(/^http/, 'ws')

  return fromUrl(url, auth.token ? {token$: auth.token} : {})
}

function resolveSource({
  config,
  client,
  currentUser,
  schema,
  authenticated,
  auth,
}: ResolveSourceOptions): Source {
  const {dataset, projectId} = config
  const bifur = getBifurClient(client, auth)
  const errors: unknown[] = []

  const context = {
    client,
    currentUser,
    dataset,
    projectId,
    schema,
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
    errors.push(e)
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
    errors.push(e)
  }

  const initialTemplatesResponses = templates
    // filter out the ones with parameters to fill
    .filter((template) => !template.parameters?.length)
    .map(
      (template): TemplateResponse => ({
        templateId: template.id,
        description: template.description,
        icon: template.icon,
        title: template.title,
      })
    )

  const templateMap = templates.reduce((acc, template) => {
    acc.set(template.id, template)
    return acc
  }, new Map<string, Template>())

  // TODO: extract this function
  const resolveNewDocumentOptions: Source['document']['resolveNewDocumentOptions'] = (
    creationContext
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
        // TODO: figure out this name
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
              `Could not find matching schema type \`${template.schemaType}\` for template \`${template.id}\``
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
    client,
    dataset,
    projectId,
    tools,
    currentUser,
    authenticated,
    templates,
    auth,
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
          reducer: _documentLanguageFilterReducer,
        }),
    },
    form: {
      renderField: _createRenderField(config),
      renderInput: _createRenderInput(config),
      renderItem: _createRenderItem(config),
      renderPreview: _createRenderPreview(config),
      file: {
        assetSources: resolveConfigProperty({
          config,
          context,
          initialValue: defaultFileAssetSources,
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
          initialValue: defaultImageAssetSources,
          propertyName: 'formBuilder.image.assetSources',
          reducer: imageAssetSourceResolver,
        }),
        directUploads:
          // TODO: consider refactoring this to `noDirectUploads` or similar
          // default value for this is `true`
          config.form?.file?.directUploads === undefined ? true : config.form.file.directUploads,
      },
    },

    __internal: {
      bifur,
      staticInitialValueTemplateItems,
    },
  }

  return source
}
