import fs from 'node:fs/promises'
import path from 'node:path'
import {PassThrough} from 'node:stream'
import {type Gzip} from 'node:zlib'

import {type CliCommandContext, type CliOutputter} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import FormData from 'form-data'
import readPkgUp from 'read-pkg-up'

import {debug as debugIt} from '../../debug'

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
  projectId: string
  title: string | null
  appHost: string
  urlType: 'internal' | 'external'
  createdAt: string
  updatedAt: string
  type: 'studio'
  activeDeployment?: ActiveDeployment | null
}

export interface GetUserApplicationsOptions {
  client: SanityClient
}

export interface GetUserApplicationOptions extends GetUserApplicationsOptions {
  appHost?: string
}

export async function getUserApplication({
  client,
  appHost,
}: GetUserApplicationOptions): Promise<UserApplication | null> {
  try {
    return await client.request({
      uri: '/user-applications',
      query: appHost ? {appHost} : {default: 'true'},
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
}: GetUserApplicationsOptions): Promise<UserApplication[] | null> {
  try {
    return await client.request({
      uri: '/user-applications',
    })
  } catch (e) {
    if (e?.statusCode === 404) {
      return null
    }

    debug('Error getting user application', e)
    throw e
  }
}

function createUserApplication(
  client: SanityClient,
  body: Pick<UserApplication, 'appHost' | 'urlType'> & {
    title?: string
  },
): Promise<UserApplication> {
  return client.request({uri: '/user-applications', method: 'POST', body})
}

export interface GetOrCreateUserApplicationOptions {
  client: SanityClient
  context: Pick<CliCommandContext, 'output' | 'prompt'>
  spinner: ReturnType<CliOutputter['spinner']>
}

/**
 * This function handles the logic for managing user applications when
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
export async function getOrCreateUserApplication({
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

  const userApplications = await getUserApplications({client})

  if (userApplications?.length) {
    const choices = userApplications.map((app) => ({
      value: app.appHost,
      name: app.appHost,
    }))

    const selected = await prompt.single({
      message: 'Select existing studio hostname',
      type: 'list',
      choices: [
        {value: 'new', name: 'Create new studio hostname'},
        new prompt.Separator(),
        ...choices,
      ],
    })

    // if the user selected an existing app, return it
    if (selected !== 'new') {
      return userApplications.find((app) => app.appHost === selected)!
    }
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
 * This function handles the logic for managing user applications when
 * studioHost is provided in the CLI config.
 *
 * @internal
 */
export async function getOrCreateUserApplicationFromConfig({
  client,
  context,
  spinner,
  appHost,
}: GetOrCreateUserApplicationOptions & {
  appHost: string
}): Promise<UserApplication> {
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

export interface CreateDeploymentOptions {
  client: SanityClient
  applicationId: string
  version: string
  isAutoUpdating: boolean
  tarball: Gzip
}

export async function createDeployment({
  client,
  tarball,
  applicationId,
  isAutoUpdating,
  version,
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
  })
}

export interface DeleteUserApplicationOptions {
  client: SanityClient
  applicationId: string
}

export async function deleteUserApplication({
  applicationId,
  client,
}: DeleteUserApplicationOptions): Promise<void> {
  await client.request({uri: `/user-applications/${applicationId}`, method: 'DELETE'})
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
