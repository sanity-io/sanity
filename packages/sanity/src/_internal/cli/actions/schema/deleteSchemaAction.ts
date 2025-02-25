import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'

export interface DeleteSchemaFlags {
  ids: string
}

export default async function deleteSchemaAction(
  args: CliCommandArguments<DeleteSchemaFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  //split ids by comma
  const schemaIds = flags.ids.split(',')

  const {apiClient, output} = context
  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  const projectId = client.config().projectId
  const dataset = client.config().dataset

  if (!projectId || !dataset) {
    output.error('Project ID and Dataset must be defined.')
    return
  }

  schemaIds.forEach(async (schemaId) => {
    const deletedSchema = await client
      .withConfig({
        dataset: dataset,
        projectId: projectId,
      })
      .delete(schemaId.trim())

    if (!deletedSchema) {
      output.error(`No schema found with id: ${schemaId}`)
      return
    }

    output.success(`Schema ${schemaId} deleted`)
  })
}
