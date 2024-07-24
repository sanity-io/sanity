import path from 'node:path'
import zlib from 'node:zlib'

import {type CliCommandArguments, type CliCommandContext} from '@sanity/cli'
import tar from 'tar-fs'

import buildSanityStudio, {type BuildSanityStudioCommandFlags} from '../build/buildAction'
import {
  checkDir,
  createDeployment,
  dirIsEmptyOrNonExistent,
  getInstalledSanityVersion,
  getOrCreateUserApplication,
} from './helpers'

export interface DeployStudioActionFlags extends BuildSanityStudioCommandFlags {
  build?: boolean
}

export default async function deployStudioAction(
  args: CliCommandArguments<DeployStudioActionFlags>,
  context: CliCommandContext,
): Promise<void> {
  const {apiClient, workDir, chalk, output, prompt, cliConfig} = context
  const flags = {build: true, ...args.extOptions}
  const customSourceDir = args.argsWithoutOptions[0]
  const sourceDir = path.resolve(process.cwd(), customSourceDir || path.join(workDir, 'dist'))
  const isAutoUpdating =
    flags['auto-updates'] ||
    (cliConfig && 'autoUpdates' in cliConfig && cliConfig.autoUpdates === true) ||
    false
  const installedSanityVersion = await getInstalledSanityVersion()

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  }).withConfig({apiVersion: 'vX'})

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

  const userApplication = await getOrCreateUserApplication({
    client,
    context,
    // ensures only v3 configs with `studioHost` are sent
    ...(cliConfig && 'studioHost' in cliConfig && {cliConfig}),
  })

  // Always build the project, unless --no-build is passed
  const shouldBuild = flags.build
  if (shouldBuild) {
    const buildArgs = [customSourceDir].filter(Boolean)
    const {didCompile} = await buildSanityStudio(
      {...args, extOptions: flags, argsWithoutOptions: buildArgs},
      context,
      {basePath: '/'},
    )

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
    throw err
  }

  // Now create a tarball of the given directory
  const parentDir = path.dirname(sourceDir)
  const base = path.basename(sourceDir)
  const tarball = tar.pack(parentDir, {entries: [base]}).pipe(zlib.createGzip())

  spinner = output.spinner('Deploying to Sanity.Studio').start()
  try {
    await createDeployment({
      client,
      applicationId: userApplication.id,
      version: installedSanityVersion,
      isAutoUpdating,
      tarball,
    })

    spinner.succeed()

    // And let the user know we're done
    output.print(
      `\nSuccess! Studio deployed to ${chalk.cyan(`https://${userApplication.appHost}.sanity.studio`)}`,
    )
  } catch (err) {
    spinner.fail()
    throw err
  }
}
