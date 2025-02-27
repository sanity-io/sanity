import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityDocument} from '@sanity/client'
import chalk from 'chalk'
import {size, sortBy, uniqBy} from 'lodash'

import {type ManifestWorkspaceFile} from '../../../manifest/manifestTypes'
import {getManifestPath, readManifest, throwIfProjectIdMismatch} from './storeSchemasAction'

export interface SchemaListFlags {
  json: boolean
  id: string
  path: string
}

type PrintSchemaListArgs = {
  schemas: SanityDocument[]
  output: CliOutputter
  dataset: string
  projectId: string
  path: string
}

export const SANITY_WORKSPACE_SCHEMA_TYPE = 'sanity.workspace.schema'

const printSchemaList = ({
  schemas,
  output,
}: Omit<PrintSchemaListArgs, 'path' | 'dataset' | 'projectId'>) => {
  const ordered = sortBy(
    schemas.map(({_createdAt: createdAt, _id: id, workspace}) => {
      return [id, workspace.name, workspace.dataset, workspace.projectId, createdAt].map(String)
    }),
    ['createdAt'],
  )
  const headings = ['Id', 'Workspace', 'Dataset', 'ProjectId', 'CreatedAt']
  const rows = ordered.reverse()

  const maxWidths = rows.reduce(
    (max, row) => row.map((current, index) => Math.max(size(current), max[index])),
    headings.map((str) => size(str)),
  )

  const printRow = (row: string[]) => row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')

  output.print(chalk.cyan(printRow(headings)))
  rows.forEach((row) => output.print(printRow(row)))
}

export default async function fetchSchemaAction(
  args: CliCommandArguments<SchemaListFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const {apiClient, output} = context
  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  const projectId = client.config().projectId

  if (!projectId) {
    output.error('Project ID must be defined.')
    return
  }

  const manifestPath = getManifestPath(context, flags.path)
  const manifest = readManifest(manifestPath, output)

  // Gather all schemas
  const results = await Promise.allSettled(
    uniqBy<ManifestWorkspaceFile>(manifest.workspaces, 'dataset').map(async (workspace) => {
      throwIfProjectIdMismatch(workspace, projectId)
      if (flags.id) {
        // Fetch a specific schema by id
        return await client
          .withConfig({
            dataset: workspace.dataset,
            projectId: workspace.projectId,
          })
          .getDocument(flags.id)
      }
      // Fetch all schemas
      return await client
        .withConfig({
          dataset: workspace.dataset,
          projectId: workspace.projectId,
          useCdn: false,
        })
        .fetch<SanityDocument[]>(`*[_type == $type]`, {
          type: SANITY_WORKSPACE_SCHEMA_TYPE,
        })
    }),
  )

  // Log errors and collect successful results
  const schemas = results
    .map((result, index) => {
      if (result.status === 'rejected') {
        const workspace = manifest.workspaces[index]
        output.error(
          chalk.red(
            `Failed to fetch schemas for workspace '${workspace.name}': ${result.reason.message}`,
          ),
        )
        return []
      }
      return result.value
    })
    .flat()

  if (schemas.length === 0) {
    output.error(`No schemas found`)
    return
  }

  if (flags.json) {
    output.print(`${JSON.stringify(flags.id ? schemas[0] : schemas, null, 2)}`)
  } else {
    printSchemaList({schemas: schemas as SanityDocument[], output})
  }
}
