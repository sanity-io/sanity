import {type CliCommandArguments, type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityDocument} from '@sanity/client'
import chalk from 'chalk'
import {size, sortBy} from 'lodash'

export interface SchemaListFlags {
  json: boolean
  id: string
}

type PrintSchemaListArgs = {
  schemas: SanityDocument[]
  output: CliOutputter
  dataset: string
  projectId: string
}

export const SANITY_WORKSPACE_SCHEMA_ID = 'sanity.workspace.schema'

const printSchemaList = ({schemas, output, dataset, projectId}: PrintSchemaListArgs) => {
  const ordered = sortBy(
    schemas.map(({_createdAt: createdAt, _id: id, workspace}) => {
      return [id, workspace.title, dataset, projectId, createdAt].map(String)
    }),
    ['createdAt'],
  )
  const headings = ['Id', 'Title', 'Dataset', 'ProjectId', 'CreatedAt']
  const rows = ordered.reverse()

  const maxWidths = rows.reduce(
    (max, row) => row.map((current, index) => Math.max(size(current), max[index])),
    headings.map((str) => size(str)),
  )

  const printRow = (row: string[]) => row.map((col, i) => `${col}`.padEnd(maxWidths[i])).join('   ')

  output.print(chalk.cyan(printRow(headings)))
  rows.forEach((row) => output.print(printRow(row)))
}

export default async function storeSchemaAction(
  args: CliCommandArguments<SchemaListFlags>,
  context: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  if (typeof flags.id === 'boolean') throw new Error('Id is empty')
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

  let schemas: SanityDocument[]

  if (flags.id) {
    // Fetch a specific schema by id
    schemas = await client
      .withConfig({
        dataset: dataset,
        projectId: projectId,
      })
      .fetch<SanityDocument[]>(`*[_type == $type && _id == $id]`, {
        id: flags.id,
        type: SANITY_WORKSPACE_SCHEMA_ID,
      })
  } else {
    // Fetch all schemas
    schemas = await client
      .withConfig({
        dataset: dataset,
        projectId: projectId,
      })
      .fetch<SanityDocument[]>(`*[_type == $type]`, {
        type: SANITY_WORKSPACE_SCHEMA_ID,
      })
  }

  if (schemas.length === 0) {
    if (flags.id) {
      output.error(`No schema found with id: ${flags.id}`)
    } else {
      output.error(`No schemas found`)
    }
    return
  }

  if (flags.json) {
    output.print(`${JSON.stringify(flags.id ? schemas[0] : schemas, null, 2)}`)
  } else {
    printSchemaList({schemas, output, dataset, projectId})
  }
}
