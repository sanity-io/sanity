import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'

import {type ManifestV1, type SerializedManifestWorkspace} from '../../../manifest/manifestTypes'
import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'

const MANIFEST_FILENAME = 'v1.studiomanifest.json'
const SCHEMA_FILENAME_SUFFIX = '.studioschema.json'

interface ExtractFlags {
  workspace?: string
  path?: string
  silent?: boolean
}

export async function extractManifestSafe(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  try {
    await extractManifest(args, context)
  } catch (err) {
    // best-effort extraction
    context.output.print('Complicated schema detected.')
    if (!args.extOptions.silent) {
      context.output.error(err)
    }
  }
}

async function extractManifest(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, workDir, chalk} = context

  const flags = args.extOptions
  const defaultOutputDir = resolve(join(workDir, 'dist'))

  const outputDir = resolve(defaultOutputDir)
  const defaultStaticPath = join(outputDir, 'static')

  const staticPath = flags.path ?? defaultStaticPath

  const path = join(staticPath, MANIFEST_FILENAME)

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

  const start = Date.now()
  const spinner = output.spinner({}).start('Extracting manifest')

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      enforceRequiredFields: false,
      format: 'manifest',
    } satisfies ExtractSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  try {
    const schemas = await new Promise<ExtractSchemaWorkerResult<'manifest'>[]>(
      (resolveSchemas, reject) => {
        const schemaBuffer: ExtractSchemaWorkerResult<'manifest'>[] = []
        worker.addListener('message', (message) => schemaBuffer.push(message))
        worker.addListener('exit', () => resolveSchemas(schemaBuffer))
        worker.addListener('error', reject)
      },
    )

    spinner.text = `Writing manifest to ${chalk.cyan(path)}`

    await mkdir(staticPath, {recursive: true})

    const manifestWorkspaces = await externalizeSchemas(schemas, staticPath)

    const manifestV1: ManifestV1 = {
      version: 1,
      createdAt: new Date().toISOString(),
      workspaces: manifestWorkspaces,
    }

    await writeFile(path, JSON.stringify(manifestV1, null, 2))

    spinner.succeed(`Extracted manifest to ${chalk.cyan(path)}: (${Date.now() - start}ms)`)
  } catch (err) {
    spinner.fail(`Failed to extract manifest (${Date.now() - start}ms)`)
    throw err
  }
}

function externalizeSchemas(
  schemas: ExtractSchemaWorkerResult<'manifest'>[],
  staticPath: string,
): Promise<SerializedManifestWorkspace[]> {
  const output = schemas.reduce<Promise<SerializedManifestWorkspace>[]>((workspaces, workspace) => {
    return [...workspaces, externalizeSchema(workspace, staticPath)]
  }, [])

  return Promise.all(output)
}

async function externalizeSchema(
  workspace: ExtractSchemaWorkerResult<'manifest'>,
  staticPath: string,
): Promise<SerializedManifestWorkspace> {
  const schemaString = JSON.stringify(workspace.schema, null, 2)
  const hash = createHash('sha1').update(schemaString).digest('hex')
  const filename = `${hash.slice(0, 8)}.${SCHEMA_FILENAME_SUFFIX}`

  // workspaces with identical schemas will overwrite each others schema file. This is ok, since they are identical and can be shared
  await writeFile(join(staticPath, filename), schemaString)

  return {
    ...workspace,
    schema: filename,
  }
}
