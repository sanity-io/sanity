import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import readPkgUp from 'read-pkg-up'

import {
  type CreateManifest,
  type CreateWorkspaceManifest,
  type ManifestWorkspaceFile,
} from '../../../manifest/manifestTypes'
import {type ExtractManifestWorkerData} from '../../threads/extractManifest'
import {getTimer} from '../../util/timing'

const MANIFEST_FILENAME = 'create-manifest.json'
const SCHEMA_FILENAME_SUFFIX = '.create-schema.json'

/** Escape-hatch env flags to change action behavior */
const EXTRACT_MANIFEST_DISABLED = process.env.SANITY_CLI_EXTRACT_MANIFEST_ENABLED === 'false'
const EXTRACT_MANIFEST_LOG_ERRORS = process.env.SANITY_CLI_EXTRACT_MANIFEST_LOG_ERRORS === 'true'

const CREATE_TIMER = 'create-manifest'

interface ExtractFlags {
  path?: string
}

/**
 * This method will never throw
 */
export async function extractManifestSafe(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  if (EXTRACT_MANIFEST_DISABLED) {
    return
  }

  try {
    await extractManifest(args, context)
  } catch (err) {
    // best-effort extraction
    context.output.print(
      'Unable to extract manifest. Certain features like Sanity Create will not work with this studio.',
    )
    if (EXTRACT_MANIFEST_LOG_ERRORS) {
      context.output.error(err)
    }
  }
}

async function extractManifest(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {output, workDir} = context

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
    'extractManifest.js',
  )

  const timer = getTimer()
  timer.start(CREATE_TIMER)
  const spinner = output.spinner({}).start('Extracting manifest')

  const worker = new Worker(workerPath, {
    workerData: {workDir} satisfies ExtractManifestWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  try {
    const workspaceManifests = await new Promise<CreateWorkspaceManifest[]>(
      (resolveWorkspaces, reject) => {
        const buffer: CreateWorkspaceManifest[] = []
        worker.addListener('message', (message) => buffer.push(message))
        worker.addListener('exit', () => resolveWorkspaces(buffer))
        worker.addListener('error', reject)
      },
    )

    await mkdir(staticPath, {recursive: true})

    const workspaceFiles = await writeWorkspaceFiles(workspaceManifests, staticPath)

    const manifest: CreateManifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      workspaces: workspaceFiles,
    }

    await writeFile(path, JSON.stringify(manifest, null, 2))
    const manifestDuration = timer.end(CREATE_TIMER)

    spinner.succeed(`Extracted manifest (${manifestDuration.toFixed()}ms)`)
  } catch (err) {
    spinner.fail()
    throw err
  }
}

function writeWorkspaceFiles(
  manifestWorkspaces: CreateWorkspaceManifest[],
  staticPath: string,
): Promise<ManifestWorkspaceFile[]> {
  const output = manifestWorkspaces.reduce<Promise<ManifestWorkspaceFile>[]>(
    (workspaces, workspace) => {
      return [...workspaces, writeWorkspaceSchemaFile(workspace, staticPath)]
    },
    [],
  )
  return Promise.all(output)
}

async function writeWorkspaceSchemaFile(
  workspace: CreateWorkspaceManifest,
  staticPath: string,
): Promise<ManifestWorkspaceFile> {
  const schemaString = JSON.stringify(workspace.schema, null, 2)
  const hash = createHash('sha1').update(schemaString).digest('hex')
  const filename = `${hash.slice(0, 8)}${SCHEMA_FILENAME_SUFFIX}`

  // workspaces with identical schemas will overwrite each others schema file. This is ok, since they are identical and can be shared
  await writeFile(join(staticPath, filename), schemaString)

  return {
    ...workspace,
    schema: filename,
  }
}
