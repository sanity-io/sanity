/* eslint-disable max-statements */
import path from 'node:path'
import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import tar from 'tar-fs'

import {shouldAutoUpdate} from '../../util/shouldAutoUpdate'
import buildSanityStudio, {type BuildSanityStudioCommandFlags} from '../build/buildAction'
import {SCHEMA_STORE_FEATURE_ENABLED} from '../schema/schemaStoreConstants'
import storeManifestSchemas from '../schema/storeSchemasAction'
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
}

// eslint-disable-next-line complexity
export default async function deployStudioAction(
  args: CliCommandArguments<DeployStudioActionFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, workDir, chalk, output, prompt, cliConfig} = context
  const flags = {build: true, ...args.extOptions}
  const customSourceDir = args.argsWithoutOptions[0]
  const sourceDir = path.resolve(process.cwd(), customSourceDir || path.join(workDir, 'dist'))
  const isAutoUpdating = shouldAutoUpdate({flags, cliConfig})

  const installedSanityVersion = await getInstalledSanityVersion()
  const configStudioHost = cliConfig && 'studioHost' in cliConfig && cliConfig.studioHost

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'v2024-08-01'})

  if (customSourceDir === 'graphql') {
    throw new Error('Did you mean `sanity graphql deploy`?')
  }

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

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start()

  let userApplication: UserApplication

  try {
    // If the user has provided a studioHost in the config, use that
    if (configStudioHost) {
      userApplication = await getOrCreateUserApplicationFromConfig({
        client,
        context,
        spinner,
        appHost: configStudioHost,
      })
    } else {
      userApplication = await getOrCreateStudio({client, context, spinner})
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

  if (SCHEMA_STORE_FEATURE_ENABLED) {
    await storeManifestSchemas(
      {
        'extract-manifest': shouldBuild,
        'manifest-dir': `${sourceDir}/static`,
        'schema-required': flags['schema-required'],
        'verbose': flags.verbose,
      },
      context,
    )
  } else if (shouldBuild) {
    await createManifestExtractor({
      ...context,
      safe: true,
    })(`${sourceDir}/static`)
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

  spinner = output.spinner('Deploying to Sanity.Studio').start()
  try {
    const {location} = await createDeployment({
      client,
      applicationId: userApplication.id,
      version: installedSanityVersion,
      isAutoUpdating,
      tarball,
    })

    spinner.succeed()

    // And let the user know we're done
    output.print(`\nSuccess! Studio deployed to ${chalk.cyan(location)}`)

    if (!configStudioHost) {
      output.print(`\nAdd ${chalk.cyan(`studioHost: '${userApplication.appHost}'`)}`)
      output.print(`to defineCliConfig root properties in sanity.cli.js or sanity.cli.ts`)
      output.print(`to avoid prompting for hostname on next deploy.`)
    }
  } catch (err) {
    spinner.fail()
    debug('Error deploying studio', err)
    throw err
  }
}
