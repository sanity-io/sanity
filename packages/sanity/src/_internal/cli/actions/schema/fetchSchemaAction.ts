import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {type SanityDocumentLike} from '@sanity/types'

export interface FetchSchemaFlags {
  id: string
}

export default async function fetchSchemaAction(
  args: CliCommandArguments<FetchSchemaFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, output} = context
  const flags = args.extOptions
  const schemaId = flags.id
  const spinner = output.spinner({}).start('Fetching schema')
  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  const projectId = client.config().projectId
  const dataset = client.config().dataset

  const schemas = await client
    .withConfig({
      dataset: dataset,
      projectId: projectId,
    })
    .fetch<SanityDocumentLike[]>(`*[_type == "sanity.workspace.schema" && _id == "${schemaId}"]`)

  //ids are unique so we can just take the first one
  const schema = schemas[0]
  if (!schema) {
    spinner.fail(`Schema ${schemaId} not found`)
    return
  }

  spinner.succeed('Schema fetched:')

  spinner.info(`${JSON.stringify(schema, null, 2)}`)
}
