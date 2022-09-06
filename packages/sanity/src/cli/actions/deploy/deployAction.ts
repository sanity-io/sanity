import path from 'path'
import zlib from 'zlib'
import {promises as fs} from 'fs'
import tar from 'tar-fs'
import type {SanityClient} from '@sanity/client'
import type {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import buildSanityStudio, {BuildSanityStudioCommandFlags} from '../build/buildAction'

export interface DeployStudioActionFlags extends BuildSanityStudioCommandFlags {
  build?: boolean
}

export default async function deployStudio(
  args: CliCommandArguments<DeployStudioActionFlags>,
  context: CliCommandContext
): Promise<void> {
  const {apiClient, workDir, chalk, output, prompt} = context
  const flags = {build: true, ...args.extOptions}
  const destFolder = args.argsWithoutOptions[0]
  const sourceDir = path.resolve(process.cwd(), destFolder || path.join(workDir, 'dist'))

  if (destFolder === 'graphql') {
    throw new Error('Did you mean `sanity graphql deploy`?')
  }

  if (destFolder) {
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

  const client = apiClient({
    requireUser: true,
    requireProject: true,
  })

  // Check that the project has a studio hostname
  let spinner = output.spinner('Checking project info').start()
  const project = await client.projects.getById(client.config().projectId as string)
  let studioHostname = project && project.studioHost
  spinner.succeed()

  if (!studioHostname) {
    output.print('Your project has not been assigned a studio hostname.')
    output.print('To deploy your Sanity Studio to our hosted Sanity.Studio service,')
    output.print('you will need one. Please enter the part you want to use.')

    studioHostname = await prompt.single({
      type: 'input',
      filter: (inp: string) => inp.replace(/\.sanity\.studio$/i, ''),
      message: 'Studio hostname (<value>.sanity.studio):',
      validate: (name: string) => validateHostname(name, client),
    })
  }

  // Always build the project, unless --no-build is passed
  const shouldBuild = flags.build
  if (shouldBuild) {
    const buildArgs = [destFolder].filter(Boolean)
    const {didCompile} = await buildSanityStudio(
      {...args, extOptions: flags, argsWithoutOptions: buildArgs},
      context,
      {basePath: '/'}
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
    const response = await client.request({
      method: 'POST',
      url: '/deploy',
      body: tarball,
      maxRedirects: 0,
    })

    spinner.succeed()

    // And let the user know we're done
    output.print(`\nSuccess! Studio deployed to ${chalk.cyan(response.location)}`)
  } catch (err) {
    spinner.fail()
    throw err
  }
}

async function dirIsEmptyOrNonExistent(sourceDir: string): Promise<boolean> {
  try {
    const stats = await fs.stat(sourceDir)
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${sourceDir} is not a directory`)
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      return true
    }

    throw err
  }

  const content = await fs.readdir(sourceDir)
  return content.length === 0
}

async function checkDir(sourceDir: string) {
  try {
    const stats = await fs.stat(sourceDir)
    if (!stats.isDirectory()) {
      throw new Error(`Directory ${sourceDir} is not a directory`)
    }
  } catch (err) {
    const error = err.code === 'ENOENT' ? new Error(`Directory "${sourceDir}" does not exist`) : err

    throw error
  }

  try {
    await fs.stat(path.join(sourceDir, 'index.html'))
  } catch (err) {
    const error =
      err.code === 'ENOENT'
        ? new Error(
            [
              `"${sourceDir}/index.html" does not exist -`,
              '[SOURCE_DIR] must be a directory containing',
              'a Sanity studio built using "sanity build"',
            ].join(' ')
          )
        : err

    throw error
  }
}

async function validateHostname(value: string, client: SanityClient): Promise<boolean | string> {
  const projectId = client.config().projectId
  const uri = `/projects/${projectId}`
  const studioHost = value || ''

  // Check that it matches allowed character range
  if (!/^[a-z0-9_-]+$/i.test(studioHost)) {
    return 'Hostname can contain only A-Z, 0-9, _ and -'
  }

  // Check that the hostname is not already taken
  try {
    await client.request({uri, method: 'PATCH', body: {studioHost}})
    return true
  } catch (error) {
    if (error?.response?.body?.message) {
      return error.response.body.message
    }
    throw error
  }
}
