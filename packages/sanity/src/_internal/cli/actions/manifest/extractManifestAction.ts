import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandAction} from '@sanity/cli'
import {type ManifestV1, type ManifestV1Workspace} from '@sanity/manifest'
import readPkgUp from 'read-pkg-up'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'

const MANIFEST_FILENAME = 'v1.studiomanifest.json'
const SCHEMA_FILENAME_SUFFIX = '.studioschema.json'

const extractManifest: CliCommandAction = async (_args, context) => {
  const {output, workDir, chalk} = context

  const defaultOutputDir = resolve(join(workDir, 'dist'))
  // const outputDir = resolve(args.argsWithoutOptions[0] || defaultOutputDir)
  const outputDir = resolve(defaultOutputDir)
  const staticPath = join(outputDir, 'static')
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

  const spinner = output.spinner({}).start('Extracting manifest')

  // const trace = telemetry.trace(SchemaExtractedTrace)
  // trace.start()

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      enforceRequiredFields: false,
      format: 'direct',
    } satisfies ExtractSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  try {
    const schemas = await new Promise<ExtractSchemaWorkerResult<'direct'>[]>(
      (resolveSchemas, reject) => {
        const schemaBuffer: ExtractSchemaWorkerResult<'direct'>[] = []
        worker.addListener('message', (message) => schemaBuffer.push(message))
        worker.addListener('exit', () => resolveSchemas(schemaBuffer))
        worker.addListener('error', reject)
      },
    )

    spinner.text = `Writing manifest to ${chalk.cyan(path)}`

    await mkdir(staticPath, {recursive: true})

    const manifestWorkspaces = await externalizeSchemas(schemas, staticPath)

    const manifestV1: ManifestV1 = {
      manifestVersion: 1,
      createdAt: new Date(),
      workspaces: manifestWorkspaces,
    }

    // trace.log({
    //   schemaAllTypesCount: schema.length,
    //   schemaDocumentTypesCount: schema.filter((type) => type.type === 'document').length,
    //   schemaTypesCount: schema.filter((type) => type.type === 'type').length,
    //   enforceRequiredFields,
    //   schemaFormat: formatFlag,
    // })

    // const path = flags.path || join(process.cwd(), 'schema.json')
    // const path = 'test-manifest.json'

    await writeFile(path, JSON.stringify(manifestV1, null, 2))

    // trace.complete()

    spinner.succeed(`Extracted manifest to ${chalk.cyan(path)}`)
  } catch (err) {
    // trace.error(err)
    spinner.fail('Failed to extract manifest')
    throw err
  }
}

export default extractManifest

function externalizeSchemas(
  schemas: ExtractSchemaWorkerResult<'direct'>[],
  staticPath: string,
): Promise<ManifestV1Workspace[]> {
  const output = schemas.reduce<Promise<ManifestV1Workspace>[]>((workspaces, workspace) => {
    return [...workspaces, externalizeSchema(workspace, staticPath)]
  }, [])

  return Promise.all(output)
}

async function externalizeSchema(
  workspace: ExtractSchemaWorkerResult<'direct'>,
  staticPath: string,
): Promise<ManifestV1Workspace> {
  const encoder = new TextEncoder()
  const schemaString = JSON.stringify(workspace.schema, null, 2)
  const hash = await crypto.subtle.digest('SHA-1', encoder.encode(schemaString))
  const filename = `${hexFromBuffer(hash).slice(0, 8)}${SCHEMA_FILENAME_SUFFIX}`

  await writeFile(join(staticPath, filename), schemaString)

  return {
    ...workspace,
    schema: filename,
  }
}

function hexFromBuffer(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => `00${x.toString(16)}`.slice(-2))
    .join('')
}
