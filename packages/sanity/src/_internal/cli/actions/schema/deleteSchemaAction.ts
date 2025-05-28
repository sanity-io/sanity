import {type CliCommandContext} from '@sanity/cli'
import chalk from 'chalk'
import uniq from 'lodash/uniq'

import {isDefined} from '../../../manifest/manifestTypeHelpers'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {
  getProjectIdDatasetsOutString,
  getStringList,
  projectIdDatasetPair,
} from './utils/schemaStoreOutStrings'
import {parseDeleteSchemasConfig, type SchemaStoreCommonFlags} from './utils/schemaStoreValidation'
import {uniqueProjectIdDataset} from './utils/uniqueProjectIdDataset'

export interface DeleteSchemaFlags extends SchemaStoreCommonFlags {
  ids?: string
  dataset?: string
}

interface DeleteResult {
  projectId: string
  dataset: string
  schemaId: string
  deleted: boolean
}

class DeleteIdError extends Error {
  public schemaId: string
  public projectId: string
  public dataset: string
  constructor(args: {
    schemaId: string
    projectId: string
    dataset: string
    options?: ErrorOptions
  }) {
    super((args.options?.cause as {message?: string})?.message, args.options)
    this.name = 'DeleteIdError'
    this.schemaId = args.schemaId
    this.projectId = args.projectId
    this.dataset = args.dataset
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
  if (!(await ensureManifestExtractSatisfied({schemaRequired: true, extractManifest, manifestDir,  manifestExtractor, output, telemetry: context.telemetry}))) {
    return 'failure'
  }

  const {client, projectId} = createSchemaApiClient(apiClient)
  const manifest = await createManifestReader({manifestDir, output, jsonReader}).getManifest()

  const workspaces = manifest.workspaces.filter(
    (workspace) => !dataset || workspace.dataset === dataset,
  )

  const projectDatasets = uniqueProjectIdDataset(workspaces)

  const results = await Promise.allSettled(
    projectDatasets.flatMap(({projectId: targetProjectId, dataset: targetDataset}) => {
      return ids.map(async ({schemaId}): Promise<DeleteResult> => {
        const targetClient = client.withConfig({
          projectId: targetProjectId,
          dataset: targetDataset,
        })
        try {
          const existing = await targetClient.getDocument(schemaId)
          if (!existing) {
            return {
              projectId: targetProjectId,
              dataset: targetDataset,
              schemaId,
              deleted: false,
            }
          }

          const deletedSchema = await targetClient.request<{deleted: boolean} | undefined>({
            method: 'DELETE',
            url: `/projects/${targetProjectId}/datasets/${targetDataset}/schemas/${schemaId}`,
          })
          return {
            projectId: targetProjectId,
            dataset: targetDataset,
            schemaId,
            deleted: !!deletedSchema?.deleted,
          }
        } catch (err) {
          throw new DeleteIdError({
            schemaId,
            projectId: targetProjectId,
            dataset: targetDataset,
            options: {cause: err},
          })
        }
      })
    }),
  )

  const deletedIds = results
    .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
    .filter((r) => r.value.deleted)
    .map((r) => r.value)

  const deleteFailureIds = uniq(
    results
      .filter((r) => r.status === 'rejected')
      .map((result) => {
        const error = result.reason
        if (error instanceof DeleteIdError) {
          output.error(
            chalk.red(
              `Failed to delete schema "${error.schemaId}" in "${projectIdDatasetPair(error)}":\n${error.message}`,
            ),
          )
          if (verbose) output.error(error)
          return error.schemaId
        }
        throw error
      }),
  )

  const notFound = uniq(
    results
      .filter((r): r is PromiseFulfilledResult<DeleteResult> => r.status === 'fulfilled')
      .filter((r) => !r.value.deleted)
      .filter(
        (r) =>
          !deletedIds.map(({schemaId}) => schemaId).includes(r.value.schemaId) &&
          !deleteFailureIds.includes(r.value.schemaId),
      )
      .map((r) => r.value.schemaId),
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
              .map((result) => `- ${result.schemaId} (in ${projectIdDatasetPair(result)})`)
              .join('\n')}`
          : undefined,
        notFound.length
          ? `Ids not found in ${getProjectIdDatasetsOutString(projectDatasets)}:\n${getStringList(notFound)}`
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
