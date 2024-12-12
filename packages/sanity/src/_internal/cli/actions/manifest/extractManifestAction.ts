import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join, resolve} from 'node:path'
import {Worker} from 'node:worker_threads'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {minutesToMilliseconds} from 'date-fns'
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
const TOOLS_FILENAME_SUFFIX = '.create-tools.json'

/** Escape-hatch env flags to change action behavior */
const FEATURE_ENABLED_ENV_NAME = 'SANITY_CLI_EXTRACT_MANIFEST_ENABLED'
const EXTRACT_MANIFEST_ENABLED = process.env[FEATURE_ENABLED_ENV_NAME] !== 'false'
const EXTRACT_MANIFEST_LOG_ERRORS = process.env.SANITY_CLI_EXTRACT_MANIFEST_LOG_ERRORS === 'true'

const CREATE_TIMER = 'create-manifest'

const EXTRACT_TASK_TIMEOUT_MS = minutesToMilliseconds(2)

const EXTRACT_FAILURE_MESSAGE =
  "Couldn't extract manifest file. Sanity Create will not be available for the studio.\n" +
  `Disable this message with ${FEATURE_ENABLED_ENV_NAME}=false`

interface ExtractFlags {
  path?: string
}

/**
 * This function will never throw.
 * @returns `undefined` if extract succeeded - caught error if it failed
 */
export async function extractManifestSafe(
  args: CliCommandArguments<ExtractFlags>,
  context: CliCommandContext,
): Promise<Error | undefined> {
  if (!EXTRACT_MANIFEST_ENABLED) {
    return undefined
  }

  try {
    await extractManifest(args, context)
    return undefined
  } catch (err) {
    if (EXTRACT_MANIFEST_LOG_ERRORS) {
      context.output.error(err)
    }
    return err
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

  const timer = getTimer()
  timer.start(CREATE_TIMER)
  const spinner = output.spinner({}).start('Extracting manifest')

  try {
    const workspaceManifests = await getWorkspaceManifests({rootPkgPath, workDir})
    await mkdir(staticPath, {recursive: true})

    const workspaceFiles = await writeWorkspaceFiles(workspaceManifests, staticPath)

    const manifest: CreateManifest = {
      /**
       * Version history:
       * 1: Initial release.
       * 2: Added tools file.
       */
      version: 2,
      createdAt: new Date().toISOString(),
      workspaces: workspaceFiles,
    }

    await writeFile(path, JSON.stringify(manifest, null, 2))
    const manifestDuration = timer.end(CREATE_TIMER)

    spinner.succeed(`Extracted manifest (${manifestDuration.toFixed()}ms)`)
  } catch (err) {
    spinner.info(EXTRACT_FAILURE_MESSAGE)
    throw err
  }
}

async function getWorkspaceManifests({
  rootPkgPath,
  workDir,
}: {
  rootPkgPath: string
  workDir: string
}): Promise<CreateWorkspaceManifest[]> {
  const workerPath = join(
    dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'extractManifest.js',
  )

  const worker = new Worker(workerPath, {
    workerData: {workDir} satisfies ExtractManifestWorkerData,
    // eslint-disable-next-line no-process-env
    env: process.env,
  })

  let timeout = false
  const timeoutId = setTimeout(() => {
    timeout = true
    worker.terminate()
  }, EXTRACT_TASK_TIMEOUT_MS)

  try {
    return await new Promise<CreateWorkspaceManifest[]>((resolveWorkspaces, reject) => {
      const buffer: CreateWorkspaceManifest[] = []
      worker.addListener('message', (message) => buffer.push(message))
      worker.addListener('exit', (exitCode) => {
        if (exitCode === 0) {
          resolveWorkspaces(buffer)
        } else if (timeout) {
          reject(new Error(`Extract manifest was aborted after ${EXTRACT_TASK_TIMEOUT_MS}ms`))
        }
      })
      worker.addListener('error', reject)
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function writeWorkspaceFiles(
  manifestWorkspaces: CreateWorkspaceManifest[],
  staticPath: string,
): Promise<ManifestWorkspaceFile[]> {
  const output = manifestWorkspaces.reduce<Promise<ManifestWorkspaceFile>[]>(
    (workspaces, workspace) => {
      return [...workspaces, writeWorkspaceFile(workspace, staticPath)]
    },
    [],
  )
  return Promise.all(output)
}

async function writeWorkspaceFile(
  workspace: CreateWorkspaceManifest,
  staticPath: string,
): Promise<ManifestWorkspaceFile> {
  const [schemaFilename, toolsFilename] = await Promise.all([
    createFile(staticPath, workspace.schema, SCHEMA_FILENAME_SUFFIX),
    createFile(staticPath, workspace.tools, TOOLS_FILENAME_SUFFIX),
  ])

  return {
    ...workspace,
    schema: schemaFilename,
    tools: toolsFilename,
  }
}

const createFile = async (path: string, content: any, filenameSuffix: string) => {
  const stringifiedContent = JSON.stringify(content, null, 2)
  const hash = createHash('sha1').update(stringifiedContent).digest('hex')
  const filename = `${hash.slice(0, 8)}${filenameSuffix}`

  // workspaces with identical data will overwrite each others file. This is ok, since they are identical and can be shared
  await writeFile(join(path, filename), stringifiedContent)

  return filename
}
