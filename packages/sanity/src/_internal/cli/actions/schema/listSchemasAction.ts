import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import chalk from 'chalk'
import sortBy from 'lodash/sortBy'
import uniq from 'lodash/uniq'

import {isDefined} from '../../../manifest/manifestTypeHelpers'
import {
  SANITY_WORKSPACE_SCHEMA_TYPE,
  type StoredWorkspaceSchema,
} from '../../../manifest/manifestTypes'
import {type SchemaStoreActionResult, type SchemaStoreContext} from './schemaStoreTypes'
import {createManifestExtractor, ensureManifestExtractSatisfied} from './utils/mainfestExtractor'
import {createManifestReader} from './utils/manifestReader'
import {createSchemaApiClient} from './utils/schemaApiClient'
import {
  filterLogReadProjectIdMismatch,
  parseListSchemasConfig,
  type StoreSchemaCommonFlags,
} from './utils/schemaStoreValidation'
import {getDatasetsOutString} from './utils/storeSchemaOutStrings'

export interface SchemaListFlags extends StoreSchemaCommonFlags {
  json?: boolean
  id?: string
}

class DatasetError extends Error {
  public dataset: string
  constructor(dataset: string, options?: ErrorOptions) {
    super((options?.cause as {message?: string})?.message, options)
    this.dataset = dataset
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
  if (!(await ensureManifestExtractSatisfied({schemaRequired: true, extractManifest, manifestDir,  manifestExtractor, output,}))) {
    return 'failure'
  }
  const {client, projectId} = createSchemaApiClient(apiClient)

  const manifest = await createManifestReader({manifestDir, output, jsonReader}).getManifest()
  const workspaces = manifest.workspaces.filter((workspace) =>
    filterLogReadProjectIdMismatch(workspace, projectId, output),
  )

  const datasets = uniq(workspaces.map((w) => w.dataset))

  const schemaResults = await Promise.allSettled(
    datasets.map(async (dataset) => {
      try {
        const datasetClient = client.withConfig({dataset})
        return id
          ? datasetClient.getDocument<StoredWorkspaceSchema>(id)
          : datasetClient.fetch<StoredWorkspaceSchema[]>(`*[_type == $type]`, {
              type: SANITY_WORKSPACE_SCHEMA_TYPE,
            })
      } catch (error) {
        throw new DatasetError(dataset, {cause: error})
      }
    }),
  )

  const schemas = schemaResults
    .map((result, index) => {
      if (result.status === 'fulfilled') return result.value

      if (result.reason instanceof DatasetError) {
        const message = chalk.red(
          `↳ Failed to fetch schema from dataset "${result.reason.dataset}":\n  ${result.reason.message}`,
        )
        output.error(message)
      } else {
        //hubris inc: given the try-catch wrapping all the full promise "this should never happen"
        throw result.reason
      }
      return []
    })
    .filter(isDefined)
    .flat()

  if (schemas.length === 0) {
    const datasetString = getDatasetsOutString(datasets)
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
    printSchemaList({schemas, output})
  }
  return 'success'
}

function printSchemaList({
  schemas,
  output,
}: {
  schemas: StoredWorkspaceSchema[]
  output: CliOutputter
}) {
  const ordered = sortBy(
    schemas.map(({_createdAt: createdAt, _id: id, workspace}) => {
      return [id, workspace.name, workspace.dataset, workspace.projectId, createdAt].map(String)
    }),
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
