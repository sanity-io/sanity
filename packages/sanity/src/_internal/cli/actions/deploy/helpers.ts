import fs from 'node:fs/promises'
import path from 'node:path'
import {PassThrough} from 'node:stream'
import {fileURLToPath} from 'node:url'
import {type Gzip} from 'node:zlib'

import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import FormData from 'form-data'
import {customAlphabet} from 'nanoid'
import readPkgUp from 'read-pkg-up'

import {debug as debugIt} from '../../debug'
import {determineIsApp} from '../../util/determineIsApp'
import {promiseWithResolvers} from '../../util/promiseWithResolvers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const debug = debugIt.extend('deploy')

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

export interface GetUserApplicationOptions {
  client: SanityClient
  appHost?: string
  appId?: string
  isSdkApp?: boolean
}
export async function getUserApplication({
  client,
  appHost,
  appId,
  isSdkApp,
}: GetUserApplicationOptions): Promise<UserApplication | null> {
  let query: undefined | Record<string, string>

  const uri = appId ? `/user-applications/${appId}` : '/user-applications'

  if (isSdkApp) {
    query = {appType: 'coreApp'}
  } else if (!appId) {
    // either request the app by host or get the default app
    query = appHost ? {appHost} : {default: 'true'}
  }
  try {
    return await client.request({
      uri,
      query,
    })
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

/**
 * Creates an external studio application.
 * Validates and normalizes the URL before creation.
 *
 * @internal
 */
async function createExternalStudio({
  client,
  appHost,
}: {
  client: SanityClient
  appHost: string
}): Promise<UserApplication> {
  const validationResult = validateUrl(appHost)
  if (validationResult !== true) {
    throw new Error(validationResult)
  }

  const normalizedUrl = normalizeUrl(appHost)

  try {
    return await createUserApplication(client, {
      appHost: normalizedUrl,
      urlType: 'external',
      type: 'studio',
    })
  } catch (e) {
    debug('Error creating external user application', e)
    if ([402, 409].includes(e?.statusCode)) {
      throw new Error(e?.response?.body?.message || 'Bad request', {cause: e})
    }
    throw e
  }
}

interface SelectApplicationOptions {
  client: SanityClient
  prompt: GetOrCreateUserApplicationOptions['context']['prompt']
  message: string
  createNewLabel: string
  organizationId?: string
  urlType?: 'internal' | 'external'
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
  urlType,
}: SelectApplicationOptions): Promise<UserApplication | null> {
  const allUserApplications = await getUserApplications({client, organizationId})

  // Filter by urlType if specified
  const userApplications = urlType
    ? allUserApplications?.filter((app) => app.urlType === urlType)
    : allUserApplications

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
    choices: [...choices, new prompt.Separator(), {value: 'new', name: createNewLabel}],
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
  urlType?: 'internal' | 'external'
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

/**
 * Validates that a URL is a valid HTTP or HTTPS URL
 */
export function validateUrl(url: string): true | string {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must start with http:// or https://'
    }
    return true
  } catch {
    return 'Please enter a valid URL'
  }
}

/**
 * Normalizes an external URL by removing trailing slashes
 */
export function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export async function getOrCreateStudio({
  client,
  spinner,
  context,
  urlType = 'internal',
}: GetOrCreateUserApplicationOptions): Promise<UserApplication> {
  const {output, prompt} = context

  // For external URLs, show existing external studios or prompt for a new URL
  if (urlType === 'external') {
    spinner.succeed()

    // Use shared selection helper for existing external studios
    const selectedApp = await selectExistingApplication({
      client,
      prompt,
      message: 'Select existing external studio or create new',
      createNewLabel: 'Create new external studio',
      urlType: 'external',
    })

    if (selectedApp) {
      return selectedApp
    }

    // Prompt for new external URL
    output.print('Enter the URL to your studio.')

    const {promise, resolve} = promiseWithResolvers<UserApplication>()

    await prompt.single({
      type: 'input',
      filter: normalizeUrl,
      message: 'Studio URL (https://...):',
      validate: async (externalUrl: string) => {
        try {
          const response = await createExternalStudio({client, appHost: externalUrl})
          resolve(response)
          return true
        } catch (e) {
          // Convert error to string for prompt validation
          if (e instanceof Error) {
            return e.message
          }
          throw e
        }
      },
    })

    return await promise
  }

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
    urlType: 'internal',
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
  const organizationId = cliConfig && 'app' in cliConfig && cliConfig.app?.organizationId

  // Complete the spinner so prompt can properly work
  spinner.succeed()

  const selectedApp = await selectExistingApplication({
    client,
    prompt,
    message: 'Select an existing deployed application',
    createNewLabel: 'Create new deployed application',
    organizationId: organizationId || undefined,
    urlType: 'internal',
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
  urlType?: 'internal' | 'external'
}

type UserApplicationConfigOptions = BaseConfigOptions &
  (
    | {
        /**
         * @deprecated – appHost is replaced by appId, but kept for backwards compat
         */
        appHost: string | undefined
        appId: undefined
      }
    | {
        appId: string | undefined
        /**
         * @deprecated – appHost is replaced by appId, but kept for backwards compat
         */
        appHost: undefined
      }
  )

async function getOrCreateStudioFromConfig({
  client,
  context,
  spinner,
  appHost,
  appId,
}: UserApplicationConfigOptions): Promise<UserApplication> {
  const {output} = context

  // if there is already an existing user-app, then just return it
  const existingUserApplication = await getUserApplication({client, appId, appHost})

  // Complete the spinner so prompt can properly work
  spinner.succeed()

  if (existingUserApplication) {
    return existingUserApplication
  }

  if (!appHost) {
    throw new Error(`Application not found. Application with id ${appId} does not exist`)
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
      throw new Error(e?.response?.body?.message || 'Bad request', {cause: e}) // just in case
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
  appHost,
  appId,
}: UserApplicationConfigOptions): Promise<UserApplication> {
  const {output, cliConfig} = context
  if (appId) {
    const existingUserApplication = await getUserApplication({
      client,
      appId,
      appHost,
      isSdkApp: determineIsApp(cliConfig),
    })
    spinner.succeed()

    if (existingUserApplication) {
      return existingUserApplication
    }
  }

  // custom apps cannot arbitrarily create ids or hosts, so send them to create option
  output.print('The id provided in your configuration is not recognized.')
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
  options: UserApplicationConfigOptions,
): Promise<UserApplication> {
  const {client, context, spinner, appId, appHost, urlType} = options
  const {output} = context
  const isSdkApp = determineIsApp(context.cliConfig)

  if (isSdkApp) {
    return getOrCreateAppFromConfig(options)
  }

  // Handle external URLs: studioHost contains the full URL
  if (urlType === 'external') {
    // If appId is provided, look up the existing application by ID
    if (appId) {
      const existingUserApplication = await getUserApplication({client, appId})

      spinner.succeed()

      if (existingUserApplication) {
        return existingUserApplication
      }

      throw new Error(`Application not found. Application with id ${appId} does not exist`)
    }

    if (!appHost) {
      throw new Error(
        'External deployment requires studioHost to be set in sanity.cli.ts with a full URL, or deployment.appId to reference an existing application',
      )
    }

    // Validate and normalize URL for existence check
    const validationResult = validateUrl(appHost)
    if (validationResult !== true) {
      throw new Error(validationResult)
    }
    const normalizedUrl = normalizeUrl(appHost)

    // Check if an external application with this URL already exists
    const existingUserApplication = await getUserApplication({client, appHost: normalizedUrl})

    spinner.succeed()

    if (existingUserApplication) {
      return existingUserApplication
    }

    // Create new external studio using shared helper
    output.print(`Registering external studio at ${normalizedUrl}`)
    output.print('')
    spinner.start('Registering external studio URL')

    try {
      const response = await createExternalStudio({client, appHost: normalizedUrl})
      spinner.succeed()
      return response
    } catch (e) {
      spinner.fail()
      throw e
    }
  }

  if (!appId && !appHost) {
    throw new Error(
      'Studio was detected, but neither appId or appHost (deprecated) found in CLI config',
    )
  }

  return getOrCreateStudioFromConfig(options)
}

export interface CreateDeploymentOptions {
  client: SanityClient
  applicationId: string
  version: string
  isAutoUpdating: boolean
  tarball: Gzip | undefined
  isSdkApp?: boolean
  /** StudioManifest to include in the deployment */
  manifest?: object
}

export async function createDeployment({
  client,
  tarball,
  applicationId,
  isAutoUpdating,
  version,
  isSdkApp,
  manifest,
}: CreateDeploymentOptions): Promise<{location: string}> {
  const formData = new FormData()
  formData.append('isAutoUpdating', isAutoUpdating.toString())
  formData.append('version', version)
  // manifest must come before tarball - fastify-multipart's req.file() only captures
  // fields that appear before the file stream in multipart form data
  if (manifest) {
    formData.append('manifest', JSON.stringify(manifest))
  }
  if (tarball) {
    formData.append('tarball', tarball, {contentType: 'application/gzip', filename: 'app.tar.gz'})
  }

  return client.request({
    uri: `/user-applications/${applicationId}/deployments`,
    method: 'POST',
    headers: formData.getHeaders(),
    body: formData.pipe(new PassThrough()),
    query: isSdkApp ? {appType: 'coreApp'} : {appType: 'studio'},
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
