import type {SanityClient} from '@sanity/client'
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import yargs from 'yargs/yargs'
import {hideBin} from 'yargs/helpers'
import {getGraphQLAPIs} from './getGraphQLAPIs'

export interface DeleteGraphQLApiFlags {
  project?: string
  dataset?: string
  tag?: string
  force?: boolean
}

function parseCliFlags(args: {argv?: string[]}) {
  return yargs(hideBin(args.argv || process.argv).slice(2))
    .option('api', {type: 'string'})
    .option('project', {type: 'string'})
    .option('dataset', {type: 'string'})
    .option('tag', {type: 'string', default: 'default'})
    .option('force', {type: 'boolean'}).argv
}

export default async function deleteGraphQLApi(
  args: CliCommandArguments<DeleteGraphQLApiFlags>,
  context: CliCommandContext,
): Promise<void> {
  // Reparsing CLI flags for better control of binary flags
  const flags = await parseCliFlags(args)
  const {apiClient, output, prompt} = context

  // Use explicitly defined flags where possible
  let projectId = flags.project
  let dataset = flags.dataset
  let tag = flags.tag

  // If specifying --api, use it for the flags not provided
  if (flags.api) {
    const apiDefs = await getGraphQLAPIs(context)
    const apiDef = apiDefs.find((def) => def.id === flags.api)
    if (!apiDef) {
      throw new Error(`GraphQL API "${flags.api}" not found`)
    }

    if (projectId) {
      output.warn(`Both --api and --project specified, using --project ${projectId}`)
    } else {
      projectId = apiDef.projectId
    }

    if (dataset) {
      output.warn(`Both --api and --dataset specified, using --dataset ${dataset}`)
    } else {
      dataset = apiDef.dataset
    }

    if (tag && apiDef.tag) {
      output.warn(`Both --api and --tag specified, using --tag ${tag}`)
    } else {
      tag = apiDef.tag || 'default'
    }
  }

  // If neither --api nor --project/dataset is specified, use the CLI config for values
  let client: SanityClient
  if (!projectId || !dataset) {
    client = apiClient({
      requireUser: true,
      requireProject: true,
    }).config({apiVersion: '2023-08-01'})

    projectId = projectId || client.config().projectId
    dataset = dataset || client.config().dataset
  } else {
    client = apiClient({requireProject: false, requireUser: true}).config({projectId, dataset})
  }

  const confirmMessage =
    tag === 'default'
      ? `Are you absolutely sure you want to delete the current GraphQL API connected to the "${dataset}" dataset in project ${projectId}?`
      : `Are you absolutely sure you want to delete the GraphQL API connected to the "${dataset}" dataset in project ${projectId}, tagged "${tag}"?`

  const confirmedDelete =
    flags.force ||
    (await prompt.single({
      type: 'confirm',
      message: confirmMessage,
      default: false,
    }))

  if (!confirmedDelete) {
    return
  }

  if (projectId !== client.config().projectId) {
    client = client.clone().config({projectId})
  }

  try {
    await client.request({
      url: `/apis/graphql/${dataset}/${tag}`,
      method: 'DELETE',
    })
  } catch (err) {
    throw err
  }

  output.print('GraphQL API deleted')
}
