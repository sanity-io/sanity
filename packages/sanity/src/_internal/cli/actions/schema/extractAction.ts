import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'
import {SchemaExtractedTrace} from './extractSchema.telemetry'

interface ExtractFlags {
  'workspace'?: string
  'path'?: string
  'enforce-required-fields'?: boolean
  'format'?: 'groq-type-nodes' | string
}

export type SchemaValidationFormatter = (result: ExtractSchemaWorkerResult) => string

export default async function extractAction(
  args: CliCommandArguments<ExtractFlags>,
  {workDir, output, telemetry}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const formatFlag = flags.format || 'groq-type-nodes'
  const enforceRequiredFields = flags['enforce-required-fields'] || false

  const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  const workerPath = join(
    dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'extractSchema.js',
  )

  const spinner = output
    .spinner({})
    .start(
      enforceRequiredFields
        ? 'Extracting schema, with enforced required fields'
        : 'Extracting schema',
    )

  const trace = telemetry.trace(SchemaExtractedTrace)
  trace.start()

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      workspaceName: flags.workspace,
      enforceRequiredFields,
      format: formatFlag,
    } satisfies ExtractSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  try {
    const {schema} = await new Promise<ExtractSchemaWorkerResult>((resolve, reject) => {
      worker.addListener('message', resolve)
      worker.addListener('error', reject)
    })

    trace.log({
      schemaAllTypesCount: schema.length,
      schemaDocumentTypesCount: schema.filter((type) => type.type === 'document').length,
      schemaTypesCount: schema.filter((type) => type.type === 'type').length,
      enforceRequiredFields,
      schemaFormat: formatFlag,
    })

    const path = flags.path || join(process.cwd(), 'schema.json')

    spinner.text = `Writing schema to ${path}`

    await writeFile(path, `${JSON.stringify(schema, null, 2)}\n`)

    trace.complete()

    spinner.succeed(
      enforceRequiredFields
        ? `Extracted schema to ${path} with enforced required fields`
        : `Extracted schema to ${path}`,
    )
  } catch (err) {
    trace.error(err)
    spinner.fail(
      enforceRequiredFields
        ? 'Failed to extract schema, with enforced required fields'
        : 'Failed to extract schema',
    )
    throw err
  }
}
