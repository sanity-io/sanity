import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {getClientUrl} from '../../util/getClientUrl'

type ListApisResponse = {
  projectId: string
  dataset: string
  tag: string
  playgroundEnabled: boolean
  generation: string
}[]

export default async function listGraphQLApis(
  args: CliCommandArguments<Record<string, unknown>>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, output, chalk} = context

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).config({apiVersion: '2023-08-01'})

  let endpoints: ListApisResponse | undefined
  try {
    endpoints = await client.request<ListApisResponse>({
      url: '/apis/graphql',
      method: 'GET',
    })
  } catch (err) {
    throw err
  }

  if (!endpoints || endpoints.length === 0) {
    output.print("This project doesn't have any GraphQL endpoints deployed.")
    return
  }

  output.print('Here are the GraphQL endpoints deployed for this project:')
  endpoints.forEach((endpoint, index) => {
    const {dataset, tag} = endpoint
    const url = getClientUrl(client, `graphql/${dataset}/${tag}`)

    output.print(`${index + 1}.  ${chalk.bold('Dataset:')}     ${dataset}`)
    output.print(`    ${chalk.bold('Tag:')}         ${tag}`)
    output.print(`    ${chalk.bold('Generation:')}  ${endpoint.generation}`)
    output.print(`    ${chalk.bold('Playground:')}  ${endpoint.playgroundEnabled}`)
    output.print(`    ${chalk.bold('URL:')}  ${url}\n`)
  })
}
