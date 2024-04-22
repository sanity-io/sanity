import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandAction} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'
import z from 'zod'

import {
  type ExtractSchemaWorkerData,
  type ExtractSchemaWorkerResult,
} from '../../threads/extractSchema'

const MANIFEST_FILENAME = 'v1.studiomanifest.json'
const SCHEMA_FILENAME_PREFIX = 'schema-'

const ManifestSchema = z.object({manifestVersion: z.number()})

const ManifestV1WorkspaceSchema = z.object({
  name: z.string(),
  dataset: z.string(),
  schema: z.string(),
})

type ManifestV1Workspace = z.infer<typeof ManifestV1WorkspaceSchema>

const ManifestV1Schema = ManifestSchema.extend({
  createdAt: z.date(),
  workspaces: z.array(ManifestV1WorkspaceSchema),
})

type ManifestV1 = z.infer<typeof ManifestV1Schema>

const extractManifests: CliCommandAction = async (_args, context) => {
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
      format: 'groq-type-nodes',
    } satisfies ExtractSchemaWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  try {
    const schemas = await new Promise<ExtractSchemaWorkerResult[]>((resolveSchemas, reject) => {
      const schemaBuffer: ExtractSchemaWorkerResult[] = []
      worker.addListener('message', (message) => schemaBuffer.push(message))
      worker.addListener('exit', () => resolveSchemas(schemaBuffer))
      worker.addListener('error', reject)
    })

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

    spinner.succeed('Extracted manifest')
  } catch (err) {
    // trace.error(err)
    spinner.fail('Failed to extract manifest')
    throw err
  }

  output.print(`Extracted manifest to ${chalk.cyan(path)}`)
}

export default extractManifests

function externalizeSchemas(
  schemas: ExtractSchemaWorkerResult[],
  staticPath: string,
): Promise<z.infer<typeof ManifestV1WorkspaceSchema>[]> {
  const output = schemas.reduce<Promise<ManifestV1Workspace>[]>((workspaces, workspace) => {
    return [...workspaces, externalizeSchema(workspace, staticPath)]
  }, [])

  return Promise.all(output)
}

async function externalizeSchema(
  workspace: ExtractSchemaWorkerResult,
  staticPath: string,
): Promise<z.infer<typeof ManifestV1WorkspaceSchema>> {
  const encoder = new TextEncoder()
  const schemaString = JSON.stringify(workspace.schema, null, 2)
  const hash = await crypto.subtle.digest('SHA-1', encoder.encode(schemaString))
  const filename = `${SCHEMA_FILENAME_PREFIX}${hexFromBuffer(hash).slice(0, 8)}.json`

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
