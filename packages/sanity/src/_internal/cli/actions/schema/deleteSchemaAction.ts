import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'

import {type ManifestWorkspaceFile} from '../../../manifest/manifestTypes'
import {
  getManifestPath,
  readManifest,
  SCHEMA_STORE_ENABLED,
  throwIfProjectIdMismatch,
} from './storeSchemasAction'

export interface DeleteSchemaFlags {
  'ids': string
  'manifest-dir': string
  'dataset': string
}

export default async function deleteSchemaAction(
  args: CliCommandArguments<DeleteSchemaFlags>,
  context: CliCommandContext,
): Promise<void> {
  if (!SCHEMA_STORE_ENABLED) {
    return
  }
  const flags = args.extOptions
  if (typeof flags.dataset === 'boolean') throw new Error('Dataset is empty')
  if (typeof flags['manifest-dir'] === 'boolean') throw new Error('Manifest directory is empty')
  if (typeof flags.ids !== 'string') throw new Error('--ids is required')

  const {apiClient, output} = context

  //split ids by comma
  const schemaIds = flags.ids.split(',')

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  const projectId = client.config().projectId

  if (!projectId) {
    output.error('Project ID must be defined.')
    return
  }

  const manifestDir = flags['manifest-dir']
  const manifestPath = getManifestPath(context, manifestDir)
  const manifest = await readManifest(manifestPath, context)

  const results = await Promise.allSettled(
    manifest.workspaces.flatMap((workspace: ManifestWorkspaceFile) => {
      if (flags.dataset && workspace.dataset !== flags.dataset) {
        return []
      }
      return schemaIds.map(async (schemaId) => {
        const idWorkspace = schemaId.split('.').at(-1)
        if (idWorkspace !== workspace.name && !flags.dataset) {
          return false
        }
        try {
          throwIfProjectIdMismatch(workspace, projectId)
          const deletedSchema = await client
            .withConfig({
              dataset: flags.dataset || workspace.dataset,
              projectId: workspace.projectId,
              useCdn: false,
            })
            .delete(schemaId.trim())

          if (!deletedSchema.results.length) {
            output.error(`Schema ${schemaId} not found in workspace: ${workspace.name}`)
            return false
          }

          output.success(`Schema ${schemaId} deleted from workspace: ${workspace.name}`)
          return true
        } catch (err) {
          output.error(
            `Failed to delete schema ${schemaId} from workspace ${workspace.name}:\n ${err.message}`,
          )
          throw err
        }
      })
    }),
  )

  // Log errors and collect results
  const deletedCount = results
    .map((result, index) => {
      if (result.status === 'rejected') {
        const schemaId = schemaIds[index]
        output.error(chalk.red(`Failed to delete schema '${schemaId}':\n${result.reason.message}`))
        return false
      }
      return result.value
    })
    .filter(Boolean).length

  if (deletedCount === 0) {
    output.error('No schemas were deleted')
    return
  }

  output.success(`Successfully deleted ${deletedCount} schemas`)
}
