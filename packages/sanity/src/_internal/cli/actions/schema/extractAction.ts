import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {writeFile} from 'fs/promises'
import {dirname, join} from 'path'
import readPkgUp from 'read-pkg-up'
import {Worker} from 'worker_threads'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'

interface ExtractFlags {
  workspace?: string
  path?: string
}

export type SchemaValidationFormatter = (result: ExtractSchemaWorkerResult) => string

export default async function extractAction(
  args: CliCommandArguments<ExtractFlags>,
  {workDir, output}: CliCommandContext,
): Promise<void> {
  const flags = args.extOptions

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

  const spinner = output.spinner({prefixText: '📦', text: 'Extracting schema'}).start()

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      workspaceName: flags.workspace,
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

  spinner?.succeed('Extrcted schema')
}
