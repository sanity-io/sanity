import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

import {type ManifestSchemaType} from '../../../manifest/manifestTypes'

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

  const schema = await client
    .withConfig({
      dataset: dataset,
      projectId: projectId,
    })
    .fetch<ManifestSchemaType>(`*[_type == "sanity.workspace.schema" && _id == "${schemaId}"]`)

  spinner.succeed('Schema fetched')
  // print schema as json
  output.success(JSON.stringify(schema, null, 2))
}
