/* eslint-disable max-statements */
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {Worker} from 'node:worker_threads'
import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import {minutesToMilliseconds} from 'date-fns/minutesToMilliseconds'
import readPkgUp from 'read-pkg-up'
import tar from 'tar-fs'

import {
  type DeployStudioWorkerResult,
  type DeployStudioWorkerSuccess,
} from '../../threads/generateStudioManifest'
import {extractClientConfig} from '../../util/extractClientConfig'
import {getAppId} from '../../util/getAppId'
import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import buildSanityStudio, {type BuildSanityStudioCommandFlags} from '../build/buildAction'
import {deploySchemasAction} from '../schema/deploySchemasAction'
import {createManifestExtractor} from '../schema/utils/mainfestExtractor'
import {
  checkDir,
  createDeployment,
  debug,
  dirIsEmptyOrNonExistent,
  getInstalledSanityVersion,
  getOrCreateStudio,
  getOrCreateUserApplicationFromConfig,
  type UserApplication,
} from './helpers'

export interface DeployStudioActionFlags extends BuildSanityStudioCommandFlags {
  'build'?: boolean
  'schema-required'?: boolean
  'verbose'?: boolean
  'external'?: boolean
}

export default async function deployStudioAction(
  args: CliCommandArguments<DeployStudioActionFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, workDir, chalk, output, prompt, cliConfig} = context
  const flags = {build: true, ...args.extOptions}
  const customSourceDir = args.argsWithoutOptions[0]
  const sourceDir = path.resolve(process.cwd(), customSourceDir || path.join(workDir, 'dist'))
  const isAutoUpdating = shouldAutoUpdate({flags, cliConfig, output})
  const isExternal = !!flags.external
  const urlType: 'internal' | 'external' = isExternal ? 'external' : 'internal'

  const installedSanityVersion = await getInstalledSanityVersion()

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  if (customSourceDir === 'graphql') {
    throw new Error('Did you mean `sanity graphql deploy`?')
  }

  // Skip source directory checks for external deployments
  if (customSourceDir && !isExternal) {
    let relativeOutput = path.relative(process.cwd(), sourceDir)
    if (relativeOutput[0] !== '.') {
      relativeOutput = `./${relativeOutput}`
    }

    const isEmpty = await dirIsEmptyOrNonExistent(sourceDir)
    const shouldProceed =
      isEmpty ||
      (await prompt.single({
        type: 'confirm',
        message: `"${relativeOutput}" is not empty, do you want to proceed?`,
        default: false,
      }))

    if (!shouldProceed) {
      output.print('Cancelled.')
      return
    }

    output.print(`Building to ${relativeOutput}\n`)
  }

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start()

  const appId = getAppId({cliConfig, output})
  const configStudioHost = cliConfig && 'studioHost' in cliConfig ? cliConfig.studioHost : undefined

  let userApplication: UserApplication
  try {
    // If the user has provided an appId in the config, use that
    if (appId || configStudioHost) {
      userApplication = await getOrCreateUserApplicationFromConfig({
        client,
        context,
        spinner,
        urlType,
        ...(appId ? {appId, appHost: undefined} : {appId: undefined, appHost: configStudioHost}),
      })
    } else {
      userApplication = await getOrCreateStudio({client, context, spinner, urlType})
    }
  } catch (err) {
    if (err.message) {
      output.error(chalk.red(err.message))
      return
    }

    debug('Error creating user application', err)
    throw err
  }

  // Always build the project, unless --no-build is passed or --external is used
  const shouldBuild = flags.build && !isExternal
  if (shouldBuild) {
    const buildArgs = {
      ...args,
      extOptions: flags,
      argsWithoutOptions: [customSourceDir].filter(Boolean),
    }
    const {didCompile} = await buildSanityStudio(buildArgs, context, {basePath: '/'})

    if (!didCompile) {
      return
    }
  }

  // Deploy schemas: for internal, always run; for external, only with --schema-required
  if (!isExternal || flags['schema-required']) {
    await deploySchemasAction(
      {
        // For external, always extract from source (no dist folder)
        'extract-manifest': isExternal ? true : shouldBuild,
        'manifest-dir': isExternal ? undefined : `${sourceDir}/static`,
        'schema-required': flags['schema-required'],
        'verbose': flags.verbose,
      },
      {...context, manifestExtractor: createManifestExtractor(context)},
    )
  }

  spinner = output.spinner('Generating studio manifest').start()

  const clientConfig = extractClientConfig(client)

  const {studioManifest} = await runGenerateStudioManifestWorker(
    workDir,
    clientConfig,
    installedSanityVersion,
    spinner,
  )

  spinner.succeed('Generated studio manifest')

  if (flags.verbose) {
    if (studioManifest) {
      for (const workspace of studioManifest.workspaces) {
        output.print(
          chalk.gray(
            `↳ projectId: ${workspace.projectId}, dataset: ${workspace.dataset}, schemaDescriptorId: ${workspace.schemaDescriptorId}`,
          ),
        )
      }
    } else {
      output.print(chalk.gray(`↳ No workspaces found`))
    }
  }

  let tarball
  if (!isExternal) {
    // Ensure that the directory exists, is a directory and seems to have valid content
    spinner = output.spinner('Verifying local content').start()
    try {
      await checkDir(sourceDir)
      spinner.succeed()
    } catch (err) {
      spinner.fail()
      debug('Error checking directory', err)
      throw err
    }

    // Now create a tarball of the given directory
    const parentDir = path.dirname(sourceDir)
    const base = path.basename(sourceDir)
    tarball = tar.pack(parentDir, {entries: [base]}).pipe(zlib.createGzip())
  }

  spinner = output.spinner(isExternal ? 'Registering studio' : 'Deploying to sanity.studio').start()
  try {
    const {location} = await createDeployment({
      client,
      applicationId: userApplication.id,
      version: installedSanityVersion,
      isAutoUpdating,
      tarball,
      manifest: studioManifest ?? undefined,
    })

    spinner.succeed()

    // And let the user know we're done
    if (isExternal) {
      output.print(`\nSuccess! Studio registered`)
    } else {
      output.print(`\nSuccess! Studio deployed to ${chalk.cyan(location)}`)
    }

    if (!appId) {
      const example = `Example:
export default defineCliConfig({
  //…
  deployment: {
    ${chalk.cyan`appId: '${userApplication.id}'`},
  },
  //…
})`
      output.print(`\nAdd ${chalk.cyan(`appId: '${userApplication.id}'`)}`)
      output.print(`to the \`deployment\` section in sanity.cli.js or sanity.cli.ts`)
      output.print(`to avoid prompting for application id on next deploy.`)
      output.print(`\n${example}`)
    }
  } catch (err) {
    spinner.fail()
    debug('Error deploying studio', err)
    throw err
  }
}

const DEPLOY_WORKER_TIMEOUT_MS = minutesToMilliseconds(5)
const DEPLOY_WORKER_TIMEOUT_HUMAN = '5 minutes'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Runs the deploy studio worker to process workspaces.
 * The worker loads Workspace[] once and performs all workspace-dependent operations.
 * If the worker fails, the spinner is failed and the error is rethrown.
 */
async function runGenerateStudioManifestWorker(
  workDir: string,
  clientConfig: ReturnType<typeof extractClientConfig>,
  sanityVersion: string,
  spinner: ReturnType<CliCommandContext['output']['spinner']>,
): Promise<DeployStudioWorkerSuccess> {
  const rootPkgPath = readPkgUp.sync({cwd: __dirname})?.path
  if (!rootPkgPath) {
    throw new Error('Could not find root directory for `sanity` package')
  }

  const workerPath = path.join(
    path.dirname(rootPkgPath),
    'lib',
    '_internal',
    'cli',
    'threads',
    'generateStudioManifest.cjs',
  )

  const worker = new Worker(workerPath, {
    workerData: {
      workDir,
      clientConfig,
      sanityVersion,
    },
    env: process.env,
  })

  let timedOut = false
  const timeoutId = setTimeout(() => {
    timedOut = true
    void worker.terminate()
  }, DEPLOY_WORKER_TIMEOUT_MS)

  try {
    const result = await new Promise<DeployStudioWorkerResult>((resolve, reject) => {
      // Use `once` for automatic listener cleanup after first invocation
      worker.once('message', (message: DeployStudioWorkerResult) => {
        resolve(message)
      })
      worker.once('error', reject)
      worker.once('exit', (exitCode) => {
        // Only reject if we haven't already resolved via message
        // Non-zero exit without a message indicates an unexpected failure
        if (exitCode !== 0) {
          const error = timedOut
            ? new Error(`Deploy worker was aborted after ${DEPLOY_WORKER_TIMEOUT_HUMAN}`)
            : new Error(`Deploy worker exited with code ${exitCode}`)
          reject(error)
        }
      })
    })

    // Handle structured error responses from the worker
    if (result.type === 'error') {
      throw new Error(result.message)
    }

    return result
  } catch (err) {
    spinner.fail()
    debug('Failed to process studio configuration', err)
    throw err
  } finally {
    clearTimeout(timeoutId)
    // Ensure worker is terminated for cleanup (no-op if already terminated)
    await worker.terminate()
  }
}
