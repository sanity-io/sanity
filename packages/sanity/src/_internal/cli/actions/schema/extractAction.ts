import {writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'

interface ExtractFlags {
  workspace?: string
  path?: string
  'enforce-required-fields'?: boolean
  format?: 'groq-type-nodes' | string
}

export type SchemaValidationFormatter = (result: ExtractSchemaWorkerResult) => string

export default async function extractAction(
  args: CliCommandArguments<ExtractFlags>,
  {workDir, output}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions
  const formatFlat = flags.format || 'groq-type-nodes'

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
      flags['enforce-required-fields']
        ? 'Extracting schema, with enforced required fields'
        : 'Extracting schema',
    )

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      workspaceName: flags.workspace,
      enforceRequiredFields: flags['enforce-required-fields'],
      format: formatFlat,
    } satisfies ExtractSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  const {schema} = await new Promise<ExtractSchemaWorkerResult>((resolve, reject) => {
    worker.addListener('message', resolve)
    worker.addListener('error', reject)
  })

  const path = flags.path || join(process.cwd(), 'schema.json')

  spinner.text = `Writing schema to ${path}`

  await writeFile(path, JSON.stringify(schema, null, 2))

  spinner.succeed('Extracted schema')
}
