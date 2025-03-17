import {type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'
import uniq from 'lodash/uniq'

import {isDefined} from '../../../manifest/manifestTypeHelpers'
import {type ManifestWorkspaceFile} from '../../../manifest/manifestTypes'
import {type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, isManifestExtractSatisfied} from './utils/mainfestExtractor'
import {createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {
  assetIdsMatchesWorkspaces,
  filterLogReadProjectIdMismatch,
  parseDeleteSchemasConfig,
  type StoreSchemaCommonFlags,
} from './utils/schemaStoreValidation'
import {getDatasetsOutString, getStringArrayOutString} from './utils/storeSchemaOutStrings'

export interface DeleteSchemaFlags extends StoreSchemaCommonFlags {
  ids?: string
  dataset?: string
}

interface DeleteResult {
  workspace: ManifestWorkspaceFile
  schemaId: string
  deleted: boolean
}

class DeleteIdError extends Error {
  public id: string
  public workspace: ManifestWorkspaceFile
  constructor(id: string, workspace: ManifestWorkspaceFile, options?: ErrorOptions) {
    super((options?.cause as {message?: string})?.message, options)
    this.name = 'DeleteIdError'
    this.id = id
    this.workspace = workspace
  }
}

export default function deleteSchemasActionForCommand(
  flags: DeleteSchemaFlags,
  context: CliCommandContext,
): Promise<'success' | 'failure'> {
  return deleteSchemaAction(flags, {
    ...context,
    manifestExtractor: createManifestExtractor(context),
  })
}

/**
 * Deletes all stored schemas matching --ids in workspace datasets.
 *
 * Workspaces are determined by on-disk manifest file – not directly from sanity.config.
 * All schema store actions require a manifest to exist, and can optionally regenerate the file with --extract-manifest.
 */
export async function deleteSchemaAction(
  flags: DeleteSchemaFlags,
  context: SchemaStoreContext,
): Promise<'success' | 'failure'> {
  const {ids, dataset, extractManifest, manifestDir, verbose} = parseDeleteSchemasConfig(
    flags,
    context,
  )
  const {output, apiClient, jsonReader, manifestExtractor} = context

  // prettier-ignore
  if (!(await isManifestExtractSatisfied({schemaRequired: true, extractManifest, manifestDir,  manifestExtractor, output,}))) {
    return 'failure'
  }

  const {client, projectId} = createSchemaApiClient(apiClient)
  const manifest = await createManifestReader({manifestDir, output, jsonReader}).getManifest()

  const workspaces = manifest.workspaces
    .filter((workspace) => !dataset || workspace.dataset === dataset)
    .filter((workspace) => filterLogReadProjectIdMismatch(workspace, projectId, output))

  assetIdsMatchesWorkspaces(
    ids.map((id) => id.schemaId),
    workspaces,
  )

  const results = await Promise.allSettled(
    workspaces.flatMap((workspace: ManifestWorkspaceFile) => {
      return ids
        .filter(({workspace: idWorkspace}) => idWorkspace === workspace.name)
        .map(async ({schemaId}): Promise<DeleteResult> => {
          try {
            const deletedSchema = await client
              .withConfig({dataset: workspace.dataset})
              .delete(schemaId)
            return {workspace, schemaId, deleted: deletedSchema.results.length}
          } catch (err) {
            throw new DeleteIdError(schemaId, workspace, {cause: err})
          }
        })
    }),
  )

  const deletedIds = results
    .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
    .filter((r) => r.value.deleted)
    .map((r) => r.value.schemaId)

  const notFound = uniq(
    results
      .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
      .filter((r) => !r.value.deleted)
      .map((r) => r.value.schemaId),
  )

  const deleteFailureIds = results
    .filter((r) => r.status === 'rejected')
    .map((result) => {
      const error = result.reason
      if (error instanceof DeleteIdError) {
        output.error(
          chalk.red(
            `Failed to delete schema "${error.id}" in dataset "${error.workspace.dataset}":\n${error.message}`,
          ),
        )
        if (verbose) output.error(error)
        return error.id
      }
      //hubris inc: given the try-catch wrapping the full promise "this should never happen"
      throw error
    })

  const success = deletedIds.length === ids.length
  if (success) {
    output.success(`Successfully deleted ${deletedIds.length}/${ids.length} schemas`)
  } else {
    const datasets = uniq(workspaces.map((w) => w.dataset))
    output.error(
      [
        `Deleted ${deletedIds.length}/${ids.length} schemas.`,
        deletedIds.length
          ? `Successfully deleted ids:\n  ${getStringArrayOutString(deletedIds)}`
          : undefined,
        notFound.length
          ? `Ids not found in ${getDatasetsOutString(datasets)}:\n  ${getStringArrayOutString(notFound)}`
          : undefined,
        ...(deleteFailureIds.length
          ? [
              `Failed to delete ids:\n  ${getStringArrayOutString(deleteFailureIds)}`,
              'Check logs for errors.',
            ]
          : []),
      ]
        .filter(isDefined)
        .join('\n'),
    )
  }

  return success ? 'success' : 'failure'
}
