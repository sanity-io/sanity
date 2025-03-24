import {type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'
import uniq from 'lodash/uniq'

import {isDefined} from '../../../manifest/manifestTypeHelpers'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {
  filterLogReadProjectIdMismatch,
  parseDeleteSchemasConfig,
  type StoreSchemaCommonFlags,
} from './utils/schemaStoreValidation'
import {getDatasetsOutString, getStringList} from './utils/storeSchemaOutStrings'

export interface DeleteSchemaFlags extends StoreSchemaCommonFlags {
  ids?: string
  dataset?: string
}

interface DeleteResult {
  dataset: string
  schemaId: string
  deleted: boolean
}

class DeleteIdError extends Error {
  public id: string
  public dataset: string
  constructor(id: string, dataset: string, options?: ErrorOptions) {
    super((options?.cause as {message?: string})?.message, options)
    this.name = 'DeleteIdError'
    this.id = id
    this.dataset = dataset
  }
}

export default function deleteSchemasActionForCommand(
  flags: DeleteSchemaFlags,
  context: CliCommandContext,
): Promise<SchemaStoreActionResult> {
  return deleteSchemaAction(flags, {
    ...context,
    manifestExtractor: createManifestExtractor(context),
  })
}

/**
 * Deletes all stored schemas matching --ids in workspace datasets.
 *
 * Workspaces are determined by on-disk manifest file – not directly from sanity.config.
 * All schema store actions require a manifest to exist, so we regenerate it by default.
 * Manifest generation can be optionally disabled with --no-manifest-extract.
 * In this case the command uses and existing file or throws when missing.
 */
export async function deleteSchemaAction(
  flags: DeleteSchemaFlags,
  context: SchemaStoreContext,
): Promise<SchemaStoreActionResult> {
  const {ids, dataset, extractManifest, manifestDir, verbose} = parseDeleteSchemasConfig(
    flags,
    context,
  )
  const {output, apiClient, jsonReader, manifestExtractor} = context

  // prettier-ignore
  if (!(await ensureManifestExtractSatisfied({schemaRequired: true, extractManifest, manifestDir,  manifestExtractor, output,}))) {
    return 'failure'
  }

  const {client, projectId} = createSchemaApiClient(apiClient)
  const manifest = await createManifestReader({manifestDir, output, jsonReader}).getManifest()

  const workspaces = manifest.workspaces
    .filter((workspace) => !dataset || workspace.dataset === dataset)
    .filter((workspace) => filterLogReadProjectIdMismatch(workspace, projectId, output))

  const datasets = uniq(workspaces.map((w) => w.dataset))

  const results = await Promise.allSettled(
    datasets.flatMap((targetDataset: string) => {
      return ids.map(async ({schemaId}): Promise<DeleteResult> => {
        try {
          const deletedSchema = await client.withConfig({dataset: targetDataset}).delete(schemaId)
          return {dataset: targetDataset, schemaId, deleted: deletedSchema.results.length}
        } catch (err) {
          throw new DeleteIdError(schemaId, targetDataset, {cause: err})
        }
      })
    }),
  )

  const deletedIds = results
    .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
    .filter((r) => r.value.deleted)
    .map((r) => r.value)

  const notFound = uniq(
    results
      .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
      .filter((r) => !r.value.deleted)
      .filter((r) => !deletedIds.map(({schemaId}) => schemaId).includes(r.value.schemaId))
      .map((r) => r.value.schemaId),
  )

  const deleteFailureIds = uniq(
    results
      .filter((r) => r.status === 'rejected')
      .map((result) => {
        const error = result.reason
        if (error instanceof DeleteIdError) {
          output.error(
            chalk.red(
              `Failed to delete schema "${error.id}" in dataset "${error.dataset}":\n${error.message}`,
            ),
          )
          if (verbose) output.error(error)
          return error.id
        }
        //hubris inc: given the try-catch wrapping the full promise "this should never happen"
        throw error
      }),
  )

  const success = deletedIds.length === ids.length
  if (success) {
    output.success(`Successfully deleted ${deletedIds.length}/${ids.length} schemas`)
  } else {
    output.error(
      [
        `Deleted ${deletedIds.length}/${ids.length} schemas.`,
        deletedIds.length
          ? `Successfully deleted ids:\n${deletedIds
              .map(
                ({schemaId, dataset: targetDataset}) =>
                  `- "${schemaId}" (in ${getDatasetsOutString([targetDataset])})`,
              )
              .join('\n')}`
          : undefined,
        notFound.length
          ? `Ids not found in ${getDatasetsOutString(datasets)}:\n${getStringList(notFound)}`
          : undefined,
        ...(deleteFailureIds.length
          ? [`Failed to delete ids:\n${getStringList(deleteFailureIds)}`, 'Check logs for errors.']
          : []),
      ]
        .filter(isDefined)
        .join('\n'),
    )
  }

  return success ? 'success' : 'failure'
}
