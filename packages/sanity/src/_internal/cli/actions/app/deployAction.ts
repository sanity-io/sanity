/* eslint-disable max-statements */
import path from 'node:path'
import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import tar from 'tar-fs'

import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import buildSanityStudio, {type BuildSanityStudioCommandFlags} from '../build/buildAction'
import {
  checkDir,
  createDeployment,
  debug,
  dirIsEmptyOrNonExistent,
  getInstalledSanityVersion,
  getOrCreateApplication,
  getOrCreateUserApplicationFromConfig,
  type UserApplication,
} from '../deploy/helpers'

export interface DeployAppActionFlags extends BuildSanityStudioCommandFlags {
  build?: boolean
}

export default async function deployAppAction(
  args: CliCommandArguments<DeployAppActionFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, workDir, chalk, output, prompt, cliConfig} = context
  const flags = {build: true, ...args.extOptions}
  const customSourceDir = args.argsWithoutOptions[0]
  const sourceDir = path.resolve(process.cwd(), customSourceDir || path.join(workDir, 'dist'))
  // not really required yet, but will be required in the future
  const isAutoUpdating = shouldAutoUpdate({flags, cliConfig})

  const installedSanityVersion = await getInstalledSanityVersion()
  const appId =
    cliConfig &&
    '__experimental_appConfiguration' in cliConfig &&
    cliConfig.__experimental_appConfiguration?.appId

  const client = apiClient({
    requireUser: true,
    requireProject: false, // core apps are not project-specific
  }).withConfig({apiVersion: 'v2024-08-01'})

  if (customSourceDir) {
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

  // Check that the project exists
  let spinner = output.spinner('Checking application info').start()

  let userApplication: UserApplication

  try {
    const configParams = {
      client,
      context,
      spinner,
    }

    // If the user has provided an appId in the config, use that
    if (appId) {
      userApplication = await getOrCreateUserApplicationFromConfig({...configParams, appId})
    } else {
      userApplication = await getOrCreateApplication(configParams)
    }
  } catch (err) {
    if (err.message) {
      output.error(chalk.red(err.message))
      return
    }

    debug('Error creating user application', err)
    throw err
  }

  // Always build the project, unless --no-build is passed
  const shouldBuild = flags.build
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
  const tarball = tar.pack(parentDir, {entries: [base]}).pipe(zlib.createGzip())

  spinner = output.spinner('Deploying to Core...').start()
  try {
    await createDeployment({
      client,
      applicationId: userApplication.id,
      version: installedSanityVersion,
      isAutoUpdating,
      tarball,
      isApp: true,
    })

    spinner.succeed()

    // And let the user know we're done
    output.print(`\nSuccess! Application deployed`)

    if (!appId) {
      output.print(`\nAdd ${chalk.cyan(`appId: '${userApplication.id}'`)}`)
      output.print(`to __experimental_appConfiguration in sanity.cli.js or sanity.cli.ts`)
      output.print(`to avoid prompting on next deploy.`)
    }
  } catch (err) {
    spinner.fail()
    debug('Error deploying application', err)
    throw err
  }
}
