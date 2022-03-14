import {fromSanityClient} from '@sanity/bifur-client'
import defaultCreateSanityClient from '@sanity/client'
import {T, prepareTemplates} from '@sanity/initial-value-templates'
import {
  SanityAuthConfig,
  SanityConfig,
  SanityFormBuilderConfig,
  SanitySourceConfig,
  SanitySpace,
  SanityTool,
} from '../config'
import {SanityPlugin} from '../plugin'
import {createSchema} from '../schema'
import {SanitySource} from '../source'
import {SanityProjectConfig} from './types'

const EMPTY_ARRAY: never[] = []
const EMPTY_RECORD: Record<string, never> = {}

export function resolveSpaces(options: {spaces?: SanitySpace[]}): SanitySpace[] {
  return options.spaces || EMPTY_ARRAY
}

export function resolveProject(options: {config: SanityConfig}): SanityProjectConfig {
  return {
    ...options.config.project,
    name: options.config.project?.name || 'Sanity Studio',
  }
}

export function resolveSources(options: {
  schemaTypes: any[]
  sources?: SanitySourceConfig[]
}): SanitySource[] {
  if (!options.sources) return EMPTY_ARRAY

  return options.sources.map((sourceConfig) =>
    resolveSource({config: sourceConfig, schemaTypes: options.schemaTypes})
  )
}

export function resolveSchemaTypes(options: {plugins: SanityPlugin[]; schemaTypes?: any[]}): any[] {
  const schemaTypes = (options.schemaTypes || EMPTY_ARRAY).slice(0)

  // Collect `schemaTypes` from plugins
  for (const plugin of options.plugins) {
    if (plugin.schemaTypes) {
      schemaTypes.push(...plugin.schemaTypes)
    }
  }

  if (schemaTypes.length === 0) return EMPTY_ARRAY

  return schemaTypes
}

export function resolveAuth(options: {auth?: SanityAuthConfig}): SanityAuthConfig {
  return options.auth || EMPTY_RECORD
}

export function resolveFormBuilder(options: {
  formBuilder?: SanityFormBuilderConfig
}): SanityFormBuilderConfig {
  return options.formBuilder || EMPTY_RECORD
}

export function resolvePlugins(options: {plugins?: SanityPlugin[]}): SanityPlugin[] {
  if (!options.plugins) return EMPTY_ARRAY

  return options.plugins
}

export function resolveTools(options: {
  plugins: SanityPlugin[]
  tools?: SanityTool[]
}): SanityTool[] {
  const tools = (options.tools || EMPTY_ARRAY).slice(0)

  // Collect `tools` from plugins
  for (const plugin of options.plugins) {
    if (plugin.tools) {
      tools.push(...plugin.tools)
    }
  }

  if (tools.length === 0) return EMPTY_ARRAY

  return tools
}

function resolveSource(options: {schemaTypes: any[]; config: SanitySourceConfig}): SanitySource {
  const {config, schemaTypes = EMPTY_ARRAY} = options
  const {clientFactory: createSanityClient = defaultCreateSanityClient} = config

  const client = createSanityClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: '1',
    requestTagPrefix: 'sanity.studio',
    useCdn: false,
    withCredentials: true,
  })

  const bifur = fromSanityClient(client as any)

  // Resolve the schema for the source
  const schema = createSchema({
    name: config.name,
    types: schemaTypes.concat(config.schemaTypes),
  })

  return {
    bifur,
    client,
    dataset: config.dataset,
    initialValueTemplates: prepareTemplates(
      schema,
      typeof config?.initialValueTemplates === 'function'
        ? config.initialValueTemplates(T, {schema})
        : config?.initialValueTemplates || T.defaults(schema)
    ),
    name: config.name,
    projectId: config.projectId,
    schema,
    structureDocumentNode: config.structureDocumentNode,
    title: config.title,
  }
}
