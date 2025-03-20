import fs from 'node:fs/promises'
import path from 'node:path'
import {PassThrough} from 'node:stream'
import {type Gzip} from 'node:zlib'

import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import FormData from 'form-data'
import {customAlphabet} from 'nanoid'
import readPkgUp from 'read-pkg-up'

import {debug as debugIt} from '../../debug'
import {determineIsApp} from '../../util/determineIsApp'

export const debug = debugIt.extend('deploy')

// TODO: replace with `Promise.withResolvers()` once it lands in node
function promiseWithResolvers<T>() {
  let resolve!: (t: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

export interface ActiveDeployment {
  deployedAt: string
  deployedBy: string
  isActiveDeployment: boolean
  isAutoUpdating: boolean | null
  size: string | null
  createdAt: string
  updatedAt: string
  version: string
}

export interface UserApplication {
  id: string
  projectId: string | null
  organizationId: string | null
  title: string | null
  appHost: string
  urlType: 'internal' | 'external'
  createdAt: string
  updatedAt: string
  type: 'studio' | 'coreApp'
  activeDeployment?: ActiveDeployment | null
}

export interface GetUserApplicationsOptions {
  client: SanityClient
  organizationId?: string
}

export interface GetUserApplicationOptions extends GetUserApplicationsOptions {
  appHost?: string
  appId?: string
}
export async function getUserApplication({
  client,
  appHost,
  appId,
}: GetUserApplicationOptions): Promise<UserApplication | null> {
  let query
  let uri = '/user-applications'
  if (appId) {
    uri = `/user-applications/${appId}`
    query = {appType: 'coreApp'}
  } else if (appHost) {
    query = {appHost}
  } else {
    query = {default: 'true'}
  }
  try {
    return await client.request({uri, query})
  } catch (e) {
    if (e?.statusCode === 404) {
      return null
    }

    debug('Error getting user application', e)
    throw e
  }
}
export async function getUserApplications({
  client,
  organizationId,
}: GetUserApplicationsOptions): Promise<UserApplication[] | null> {
  const query: Record<string, string> = organizationId
    ? {organizationId: organizationId, appType: 'coreApp'}
    : {appType: 'studio'}
  try {
    return await client.request({
      uri: '/user-applications',
      query,
    })
  } catch (e) {
    if (e?.statusCode === 404) {
      return null
    }

    debug('Error getting user applications', e)
    throw e
  }
}

function createUserApplication(
  client: SanityClient,
  body: Pick<UserApplication, 'appHost' | 'urlType' | 'type'> & {
    title?: string
  },
  organizationId?: string,
): Promise<UserApplication> {
  const query: Record<string, string> = organizationId
    ? {organizationId: organizationId, appType: 'coreApp'}
    : {appType: 'studio'}
  return client.request({uri: '/user-applications', method: 'POST', body, query})
}

interface SelectApplicationOptions {
  client: SanityClient
  prompt: GetOrCreateUserApplicationOptions['context']['prompt']
  message: string
  createNewLabel: string
  organizationId?: string
}

/**
 * Shared utility for selecting an existing application or opting to create a new one
 * @internal
 */
async function selectExistingApplication({
  client,
  prompt,
  message,
  createNewLabel,
  organizationId,
}: SelectApplicationOptions): Promise<UserApplication | null> {
  const userApplications = await getUserApplications({client, organizationId})

  if (!userApplications?.length) {
    return null
  }

  const choices = userApplications.map((app) => ({
    value: app.appHost,
    name: app.title ?? app.appHost,
  }))

  const selected = await prompt.single({
    message,
    type: 'list',
    choices: [{value: 'new', name: createNewLabel}, new prompt.Separator(), ...choices],
  })

  if (selected === 'new') {
    return null
  }

  return userApplications.find((app) => app.appHost === selected)!
}

export interface GetOrCreateUserApplicationOptions {
  client: SanityClient
  context: Pick<CliCommandContext, 'output' | 'prompt' | 'cliConfig'>
  spinner: ReturnType<CliOutputter['spinner']>
}

/**
 * These functions handle the logic for managing user applications when
 * studioHost is not provided in the CLI config.
 *
 * @internal
 *
 *    +-------------------------------+
 *    |   Fetch Existing user-app?   |
 *    +---------+--------------------+
 *              |
 *        +-----+-----+
 *        |           |
 *        v           v
 *   +---------+  +-------------------------+
 *   | Return  |  | Fetch all user apps     |
 *   | user-app|  +-------------------------+
 *   +---------+            |
 *                          v
 *           +---------------------------+
 *           |  User apps found?         |
 *           +-----------+---------------+
 *                       |
 *                +------v------+
 *                |             |
 *                v             v
 *   +--------------------+  +------------------------+
 *   | Show list and      |  | Prompt for hostname    |
 *   | prompt selection   |  | and create new app     |
 *   +--------------------+  +------------------------+
 */
export async function getOrCreateStudio({
  client,
  spinner,
  context,
}: GetOrCreateUserApplicationOptions): Promise<UserApplication> {
  const {output, prompt} = context
  // if there is already an existing user-app, then just return it
  const existingUserApplication = await getUserApplication({client})

  // Complete the spinner so prompt can properly work
  spinner.succeed()

  if (existingUserApplication) {
    return existingUserApplication
  }

  const selectedApp = await selectExistingApplication({
    client,
    prompt,
    message: 'Select existing studio hostname',
    createNewLabel: 'Create new studio hostname',
  })

  if (selectedApp) {
    return selectedApp
  }

  // otherwise, prompt the user for a hostname
  output.print('Your project has not been assigned a studio hostname.')
  output.print('To deploy your Sanity Studio to our hosted sanity.studio service,')
  output.print('you will need one. Please enter the part you want to use.')

  const {promise, resolve} = promiseWithResolvers<UserApplication>()

  await prompt.single({
    type: 'input',
    filter: (inp: string) => inp.replace(/\.sanity\.studio$/i, ''),
    message: 'Studio hostname (<value>.sanity.studio):',
    // if a string is returned here, it is relayed to the user and prompt allows
    // the user to try again until this function returns true
    validate: async (appHost: string) => {
      try {
        const response = await createUserApplication(client, {
          appHost,
          urlType: 'internal',
          type: 'studio',
        })
        resolve(response)
        return true
      } catch (e) {
        // if the name is taken, it should return a 409 so we relay to the user
        if ([402, 409].includes(e?.statusCode)) {
          return e?.response?.body?.message || 'Bad request' // just in case
        }

        debug('Error creating user application', e)
        // otherwise, it's a fatal error
        throw e
      }
    },
  })

  return await promise
}

/**
 * Creates a core application with an auto-generated hostname
 *
 * @internal
 */
export async function getOrCreateApplication({
  client,
  context,
  spinner,
}: GetOrCreateUserApplicationOptions): Promise<UserApplication> {
  const {prompt, cliConfig} = context
  const organizationId =
    cliConfig &&
    '__experimental_appConfiguration' in cliConfig &&
    cliConfig.__experimental_appConfiguration?.organizationId

  // Complete the spinner so prompt can properly work
  spinner.succeed()

  const selectedApp = await selectExistingApplication({
    client,
    prompt,
    message: 'Select an existing deployed application',
    createNewLabel: 'Create new deployed application',
    organizationId: organizationId || undefined,
  })

  if (selectedApp) {
    return selectedApp
  }

  // First get the title from the user
  const title = await prompt.single({
    type: 'input',
    message: 'Enter a title for your application:',
    validate: (input: string) => input.length > 0 || 'Title is required',
  })

  const {promise, resolve, reject} = promiseWithResolvers<UserApplication>()

  // Try to create the application, retrying with new hostnames if needed
  const tryCreateApp = async () => {
    // appHosts have some restrictions (no uppercase, must start with a letter)
    const generateId = () => {
      const letters = 'abcdefghijklmnopqrstuvwxyz'
      const firstChar = customAlphabet(letters, 1)()
      const rest = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 11)()
      return `${firstChar}${rest}`
    }

    // we will likely prepend this with an org ID or other parameter in the future
    const appHost = generateId()

    try {
      const response = await createUserApplication(
        client,
        {
          appHost,
          urlType: 'internal',
          title,
          type: 'coreApp',
        },
        organizationId || undefined,
      )
      resolve(response)
      return true
    } catch (e) {
      // if the name is taken, generate a new one and try again
      if ([402, 409].includes(e?.statusCode)) {
        debug('App host taken, retrying with new host')
        return tryCreateApp()
      }

      debug('Error creating core application', e)
      reject(e)
      // otherwise, it's a fatal error
      throw e
    }
  }

  spinner.start('Creating application')

  await tryCreateApp()
  const response = await promise

  spinner.succeed()
  return response
}

export interface BaseConfigOptions {
  client: SanityClient
  context: Pick<CliCommandContext, 'output' | 'prompt' | 'cliConfig'>
  spinner: ReturnType<CliOutputter['spinner']>
}

interface StudioConfigOptions extends BaseConfigOptions {
  appHost: string
}

interface AppConfigOptions extends BaseConfigOptions {
  appId?: string
}

async function getOrCreateStudioFromConfig({
  client,
  context,
  spinner,
  appHost,
}: StudioConfigOptions): Promise<UserApplication> {
  const {output} = context
  // if there is already an existing user-app, then just return it
  const existingUserApplication = await getUserApplication({client, appHost})

  // Complete the spinner so prompt can properly work
  spinner.succeed()

  if (existingUserApplication) {
    return existingUserApplication
  }

  output.print('Your project has not been assigned a studio hostname.')
  output.print(`Creating https://${appHost}.sanity.studio`)
  output.print('')
  spinner.start('Creating studio hostname')

  try {
    const response = await createUserApplication(client, {
      appHost,
      urlType: 'internal',
      type: 'studio',
    })
    spinner.succeed()
    return response
  } catch (e) {
    spinner.fail()
    // if the name is taken, it should return a 409 so we relay to the user
    if ([402, 409].includes(e?.statusCode)) {
      throw new Error(e?.response?.body?.message || 'Bad request') // just in case
    }
    debug('Error creating user application from config', e)
    // otherwise, it's a fatal error
    throw e
  }
}

async function getOrCreateAppFromConfig({
  client,
  context,
  spinner,
  appId,
}: AppConfigOptions): Promise<UserApplication> {
  const {output, cliConfig} = context
  const organizationId =
    cliConfig &&
    '__experimental_appConfiguration' in cliConfig &&
    cliConfig.__experimental_appConfiguration?.organizationId
  if (appId) {
    const existingUserApplication = await getUserApplication({
      client,
      appId,
      organizationId: organizationId || undefined,
    })
    spinner.succeed()

    if (existingUserApplication) {
      return existingUserApplication
    }
  }

  // core apps cannot arbitrarily create ids or hosts, so send them to create option
  output.print('The appId provided in your configuration is not recognized.')
  output.print('Checking existing applications...')
  return getOrCreateApplication({client, context, spinner})
}

/**
 * This function handles the logic for managing user applications when
 * studioHost or appId is provided in the CLI config.
 *
 * @internal
 */
export async function getOrCreateUserApplicationFromConfig(
  options: BaseConfigOptions & {
    appHost?: string
    appId?: string
  },
): Promise<UserApplication> {
  const {context} = options
  const isApp = determineIsApp(context.cliConfig)

  if (isApp) {
    return getOrCreateAppFromConfig(options)
  }

  if (!options.appHost) {
    throw new Error('Studio host was detected, but is invalid')
  }

  return getOrCreateStudioFromConfig({...options, appHost: options.appHost})
}

export interface CreateDeploymentOptions {
  client: SanityClient
  applicationId: string
  version: string
  isAutoUpdating: boolean
  tarball: Gzip
  isApp?: boolean
}

export async function createDeployment({
  client,
  tarball,
  applicationId,
  isAutoUpdating,
  version,
  isApp,
}: CreateDeploymentOptions): Promise<{location: string}> {
  const formData = new FormData()
  formData.append('isAutoUpdating', isAutoUpdating.toString())
  formData.append('version', version)
  formData.append('tarball', tarball, {contentType: 'application/gzip', filename: 'app.tar.gz'})

  return client.request({
    uri: `/user-applications/${applicationId}/deployments`,
    method: 'POST',
    headers: formData.getHeaders(),
    body: formData.pipe(new PassThrough()),
    query: isApp ? {appType: 'coreApp'} : {appType: 'studio'},
  })
}

export interface DeleteUserApplicationOptions {
  client: SanityClient
  applicationId: string
  appType: 'coreApp' | 'studio'
}

export async function deleteUserApplication({
  applicationId,
  client,
  appType,
}: DeleteUserApplicationOptions): Promise<void> {
  await client.request({
    uri: `/user-applications/${applicationId}`,
    query: {
      appType,
    },
    method: 'DELETE',
  })
}

export async function getInstalledSanityVersion(): Promise<string> {
  const sanityPkgPath = (await readPkgUp({cwd: __dirname}))?.path
  if (!sanityPkgPath) {
    throw new Error('Unable to resolve `sanity` module root')
  }

  const pkg = JSON.parse(await fs.readFile(sanityPkgPath, 'utf-8'))
  if (typeof pkg?.version !== 'string') {
    throw new Error('Unable to find version of `sanity` module')
  }
  return pkg.version
}

export async function dirIsEmptyOrNonExistent(sourceDir: string): Promise<boolean> {
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

export async function checkDir(sourceDir: string): Promise<void> {
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
            ].join(' '),
          )
        : err

    throw error
  }
}
