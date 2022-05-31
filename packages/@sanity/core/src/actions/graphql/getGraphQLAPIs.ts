import path from 'path'
import {existsSync} from 'fs'
import type {CliCommandContext, CliV3CommandContext, GraphQLAPIConfig} from '@sanity/cli'
import type {Schema} from '@sanity/types'
import {getSanitySchema} from './getSanitySchema'

export interface ResolvedGraphQLAPI extends GraphQLAPIConfig {
  schema: Schema
  schemaPathResolved: string
}

export async function getGraphQLAPIs(cliContext: CliCommandContext): Promise<ResolvedGraphQLAPI[]> {
  if (!isModernCliConfig(cliContext)) {
    throw new Error('Expected Sanity studio of version 3 or above')
  }

  const {cliConfigPath = '', cliConfig} = cliContext
  const defaultDataset = cliConfig?.api?.dataset
  const configBasePath = path.dirname(cliConfigPath || '')
  const configuredApis = getGraphQLApiConfig(cliContext)

  const apis: ResolvedGraphQLAPI[] = []
  let index = 0
  for (const apiDefinition of configuredApis) {
    const schemaPath = resolveSchemaPath(apiDefinition, index, configBasePath)
    const schema = await getSanitySchema(schemaPath)
    apis.push({
      dataset: defaultDataset,
      tag: 'default',
      ...apiDefinition,
      schema,
      schemaPathResolved: schemaPath,
    })
    index++
  }

  return apis
}

function resolveSchemaPath(
  apiDefinition: GraphQLAPIConfig,
  index: number,
  configBasePath: string
): string {
  if (typeof apiDefinition.schemaPath !== 'string') {
    throw new Error(`GraphQL API at index ${index} does not have a valid "schemaPath"`)
  }

  const schemaPath: string = path.isAbsolute(apiDefinition.schemaPath)
    ? apiDefinition.schemaPath
    : path.resolve(configBasePath, apiDefinition.schemaPath)

  const schemaExt = path.extname(schemaPath)
  const hasCodeExt = /\.(js|ts)x?$/i.test(schemaExt)

  if (hasCodeExt) {
    if (!existsSync(schemaPath)) {
      throw new Error(
        `Could not resolve schema file at "${schemaPath}" for GraphQL API at index ${index}`
      )
    }

    return schemaPath
  }

  const resolvedPath = [
    `${schemaPath}.js`,
    `${schemaPath}.jsx`,
    `${schemaPath}.ts`,
    `${schemaPath}.tsx`,
    `${schemaPath}/index.js`,
    `${schemaPath}/index.jsx`,
    `${schemaPath}/index.ts`,
    `${schemaPath}/index.tsx`,
  ].find((candidate) => existsSync(candidate))

  if (!resolvedPath) {
    throw new Error(
      `Could not resolve schema file at "${schemaPath}" for GraphQL API at index ${index}`
    )
  }

  return resolvedPath
}

function getGraphQLApiConfig(cliContext: CliV3CommandContext): GraphQLAPIConfig[] {
  const config = cliContext.cliConfig

  if (!config) {
    throw new Error('No CLI configuration found (`sanity.cli.(js|ts)`)')
  }

  if (config.graphql && !Array.isArray(config.graphql)) {
    throw new Error(`"graphql" key in "${cliContext.cliConfigPath}" must be an array if defined`)
  }

  if (!config.graphql || (Array.isArray(config.graphql) && config.graphql.length === 0)) {
    throw new Error(`No GraphQL APIs defined in "${cliContext.cliConfigPath}"`)
  }

  return config.graphql
}

function isModernCliConfig(config: CliCommandContext): config is CliV3CommandContext {
  return config.sanityMajorVersion >= 3
}
