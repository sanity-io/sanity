import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'

interface DeleteGraphQLApiFlags {
  dataset?: string
  tag?: string
}

export async function deleteGraphQLApi(
  args: CliCommandArguments<DeleteGraphQLApiFlags>,
  context: CliCommandContext
): Promise<void> {
  const {apiClient, output, prompt} = context
  const flags = args.extOptions

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).config({apiVersion: '1'})

  const dataset = flags.dataset ? `${flags.dataset}` : client.config().dataset
  const tag = flags.tag ? `${flags.tag}` : 'default'

  const confirmMessage =
    tag === 'default'
      ? `Are you absolutely sure you want to delete the current GraphQL API connected to the "${dataset}" dataset?`
      : `Are you absolutely sure you want to delete the GraphQL API connected to the "${dataset}" dataset, tagged "${tag}"?`

  const confirmedDelete = await prompt.single({
    type: 'confirm',
    message: confirmMessage,
    default: false,
  })

  if (!confirmedDelete) {
    return
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
