/* eslint-disable max-nested-callbacks */
import createClient, {SanityClient} from '@sanity/client'
import {map, shareReplay} from 'rxjs/operators'
import {CurrentUser, Schema} from '@sanity/types'
import {studioTheme} from '@sanity/ui'
import {startCase} from 'lodash'
import {fromSanityClient} from '@sanity/bifur-client'
import {createSchema} from '../schema'
import {AuthStore, createAuthStore, createUserStore, UserStore} from '../datastores'
import {AuthController, AuthError, createAuthController} from '../auth'
import {InitialValueTemplateItem, Template, TemplateResponse} from '../templates'
import {isNonNullable} from '../util'
import {Source, SourceOptions, Config, ResolvedConfig} from './types'
import {
  schemaTypesReducer,
  resolveProductionUrlReducer,
  toolsReducer,
  schemaTemplatesReducer,
  documentActionsReducer,
  initialDocumentActions,
  initialDocumentBadges,
  documentBadgesReducer,
  newDocumentOptionsResolver,
} from './configPropertyReducers'
import {resolveConfigProperty} from './resolveConfigProperty'
import {ConfigResolutionError} from './ConfigResolutionError'
import {SchemaError} from './SchemaError'

type ParamsOf<T> = T extends (arg: infer U) => unknown ? U : never
type SanityClientLike = ParamsOf<typeof fromSanityClient>

export function resolveConfig(config: Config): ResolvedConfig {
  const workspaces = Array.isArray(config.__internal) ? config.__internal : [config.__internal]
  type WorkspaceResult = ResolvedConfig['__internal']['workspaces'][number]

  const results = workspaces.map(
    ({unstable_sources: nestedSources = [], ...rootSource}): WorkspaceResult => {
      const sources = [rootSource as SourceOptions, ...nestedSources]

      const resolvedSources = sources.map((source) => {
        const clientFactory = source.unstable_clientFactory ?? createClient
        const projectId = source.projectId
        const dataset = source.dataset

        const client = clientFactory({
          apiVersion: '1',
          dataset,
          projectId,
          useCdn: false,
          withCredentials: true,
        })

        const auth = {
          controller: createAuthController({client, config: source.unstable_auth}),
          store: createAuthStore({projectId}),
        }
        const userStore = createUserStore({
          authStore: auth.store,
          authController: auth.controller,
          projectId,
          client,
        })

        let schemaTypes
        try {
          schemaTypes = resolveConfigProperty({
            propertyName: 'schema.types',
            config: source,
            context: {client, projectId, dataset},
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
        const schemaErrors = schemaValidationProblemGroups?.filter(
          (msg) => !!msg.problems.find((p) => p.severity === 'error')
        )

        if (schemaValidationProblemGroups && schemaErrors?.length) {
          // TODO: consider using the `ConfigResolutionError`
          throw new SchemaError(schema)
        }

        const resolvedSource$ = userStore.me.pipe(
          map((currentUser) => {
            if (!currentUser) {
              throw new AuthError({
                message: 'Current user from user store was falsy.',
                authController: auth.controller,
                sourceOptions: source,
              })
            }

            return currentUser
          }),
          map((currentUser) =>
            resolveSource({
              config: source,
              client,
              currentUser,
              userStore,
              schema,
              auth,
            })
          ),
          shareReplay(1)
        )

        return Object.assign(resolvedSource$, {
          projectId,
          dataset,
          name: source.name,
          schema,
          subscribe: resolvedSource$.subscribe.bind(resolvedSource$),
        })
      })

      const workspaceResult: WorkspaceResult = {
        ...rootSource,
        type: 'partially-resolved-workspace',
        basePath: rootSource.basePath || '/',
        theme: rootSource.theme || studioTheme,
        sources: resolvedSources,
      }

      return workspaceResult
    }
  )

  return {
    type: 'resolved-sanity-config',
    __internal: {
      workspaces: results,
    },
  }
}

interface ResolveSourceOptions {
  config: SourceOptions
  schema: Schema
  client: SanityClient
  currentUser: CurrentUser
  userStore: UserStore
  auth: {
    controller: AuthController
    store: AuthStore
  }
}

function resolveSource({
  config,
  client,
  currentUser,
  schema,
  auth,
  userStore,
}: ResolveSourceOptions): Source {
  const {dataset, projectId} = config
  const bifur = fromSanityClient(client as SanityClientLike)
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
    name: config.name,
    title: config.title || startCase(config.name),
    schema,
    client,
    dataset,
    projectId,
    tools,
    currentUser,
    templates,
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
    },
    __internal: {
      auth,
      bifur,
      userStore,
      staticInitialValueTemplateItems,
    },
    unstable_formBuilder: config.unstable_formBuilder || {},
  }

  return source
}
