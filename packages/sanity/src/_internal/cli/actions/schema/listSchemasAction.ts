import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'
import sortBy from 'lodash/sortBy'

import {isDefined} from '../../../manifest/manifestTypeHelpers'
import {type CreateManifest, type StoredWorkspaceSchema} from '../../../manifest/manifestTypes'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {getProjectIdDatasetsOutString, projectIdDatasetPair} from './utils/schemaStoreOutStrings'
import {
  parseListSchemasConfig,
  SCHEMA_PERMISSION_HELP_TEXT,
  type SchemaStoreCommonFlags,
} from './utils/schemaStoreValidation'
import {uniqueProjectIdDataset} from './utils/uniqueProjectIdDataset'

export interface SchemaListFlags extends SchemaStoreCommonFlags {
  json?: boolean
  id?: string
}

class DatasetError extends Error {
  public projectId: string
  public dataset: string
  constructor(args: {projectId: string; dataset: string; options?: ErrorOptions}) {
    super((args.options?.cause as {message?: string})?.message, args.options)
    this.projectId = args.projectId
    this.dataset = args.dataset
    this.name = 'DatasetError'
  }
}

export default function listSchemasActionForCommand(
  flags: SchemaListFlags,
  context: CliCommandContext,
): Promise<SchemaStoreActionResult> {
  return listSchemasAction(flags, {
    ...context,
    manifestExtractor: createManifestExtractor(context),
  })
}

/**
 * Lists stored schemas found in workspace datasets.
 *
 * Workspaces are determined by on-disk manifest file – not directly from sanity.config.
 * All schema store actions require a manifest to exist, so we regenerate it by default.
 * Manifest generation can be optionally disabled with --no-manifest-extract.
 * In this case the command uses and existing file or throws when missing.
 */
export async function listSchemasAction(
  flags: SchemaListFlags,
  context: SchemaStoreContext,
): Promise<SchemaStoreActionResult> {
  const {json, id, manifestDir, extractManifest} = parseListSchemasConfig(flags, context)
  const {output, apiClient, jsonReader, manifestExtractor} = context

  // prettier-ignore
  if (!(await ensureManifestExtractSatisfied({schemaRequired: true, extractManifest, manifestDir,  manifestExtractor, output, telemetry: context.telemetry}))) {
    return 'failure'
  }
  const {client} = createSchemaApiClient(apiClient)

  const manifest = await createManifestReader({manifestDir, output, jsonReader}).getManifest()
  const projectDatasets = uniqueProjectIdDataset(manifest.workspaces)

  const schemaResults = await Promise.allSettled(
    projectDatasets.map(async ({projectId, dataset}) => {
      try {
        const datasetClient = client.withConfig({projectId, dataset})
        return id
          ? await datasetClient.request<StoredWorkspaceSchema | undefined>({
              method: 'GET',
              url: `/projects/${projectId}/datasets/${dataset}/schemas/${id}`,
            })
          : await datasetClient.request<StoredWorkspaceSchema[] | undefined>({
              method: 'GET',
              url: `/projects/${projectId}/datasets/${dataset}/schemas`,
            })
      } catch (error) {
        throw new DatasetError({projectId, dataset, options: {cause: error}})
      }
    }),
  )

  const schemas = schemaResults
    .map((result) => {
      if (result.status === 'fulfilled') return result.value

      const error = result.reason
      if (error instanceof DatasetError) {
        if (
          'cause' in error &&
          error.cause &&
          typeof error.cause === 'object' &&
          'statusCode' in error.cause &&
          error.cause.statusCode === 401
        ) {
          output.warn(
            `↳ No permissions to read schema from ${projectIdDatasetPair(error)}. ${
              SCHEMA_PERMISSION_HELP_TEXT
            }:\n  ${chalk.red(`${error.message}`)}`,
          )
          return []
        }

        const message = chalk.red(
          `↳ Failed to fetch schema from ${projectIdDatasetPair(error)}:\n  ${error.message}`,
        )
        output.error(message)
      } else {
        //hubris inc: given the try-catch wrapping all the full promise "this should never happen"
        throw error
      }
      return []
    })
    .filter(isDefined)
    .flat()

  if (schemas.length === 0) {
    const datasetString = getProjectIdDatasetsOutString(projectDatasets)
    output.error(
      id
        ? `Schema for id "${id}" not found in ${datasetString}`
        : `No schemas found in ${datasetString}`,
    )
    return 'failure'
  }

  if (json) {
    output.print(`${JSON.stringify(id ? schemas[0] : schemas, null, 2)}`)
  } else {
    printSchemaList({schemas, output, manifest})
  }
  return 'success'
}

function printSchemaList({
  schemas,
  output,
  manifest,
}: {
  schemas: StoredWorkspaceSchema[]
  output: CliOutputter
  manifest: CreateManifest
}) {
  const ordered = sortBy(
    schemas
      .map(({_createdAt: createdAt, _id: id, workspace}) => {
        const workspaceData = manifest.workspaces.find((w) => w.name === workspace.name)
        if (!workspaceData) return undefined
        return [id, workspace.name, workspaceData.dataset, workspaceData.projectId, createdAt].map(
          String,
        )
      })
      .filter(isDefined),
    ['createdAt'],
  )
  const headings = ['Id', 'Workspace', 'Dataset', 'ProjectId', 'CreatedAt']
  const rows = ordered.reverse()

  const maxWidths = rows.reduce(
    (max, row) => row.map((current, index) => Math.max(current.length, max[index])),
    headings.map((str) => str.length),
  )

  const rowToString = (row: string[]) =>
    row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')

  output.print(chalk.cyan(rowToString(headings)))
  rows.forEach((row) => output.print(rowToString(row)))
}
