import fs from 'node:fs/promises'
import path from 'node:path'
import {PassThrough} from 'node:stream'
import {type Gzip} from 'node:zlib'

import {type CliCommandContext, type CliConfig} from '@sanity/cli'
import {type SanityClient} from '@sanity/client'
import FormData from 'form-data'
import readPkgUp from 'read-pkg-up'

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
  isDefault: boolean | null
  appHost: string
  createdAt: string
  updatedAt: string
  externalAppHost: string | null
  type: 'studio'
  activeDeployment?: ActiveDeployment | null
}

export interface GetUserApplicationOptions {
  client: SanityClient
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
    if (e?.statusCode === 404) return null
    throw e
  }
}

function createUserApplication(
  client: SanityClient,
  body: {title?: string; isDefault?: boolean; appHost: string},
): Promise<UserApplication> {
  return client.request({uri: '/user-applications', method: 'POST', body})
}

export interface GetOrCreateUserApplicationOptions {
  client: SanityClient
  context: Pick<CliCommandContext, 'output' | 'prompt'>
  cliConfig?: Pick<CliConfig, 'studioHost'>
}

export async function getOrCreateUserApplication({
  client,
  cliConfig,
  context: {output, prompt},
}: GetOrCreateUserApplicationOptions): Promise<UserApplication> {
  // if there is already an existing user-app, then just return it
  const existingUserApplication = await getUserApplication({client, appHost: cliConfig?.studioHost})
  if (existingUserApplication) return existingUserApplication

  // otherwise, we need to create one.
  // if a `studioHost` was provided in the CLI config, then use that
  if (cliConfig?.studioHost) {
    return await createUserApplication(client, {
      appHost: cliConfig.studioHost,
      isDefault: true,
    })
  }

  // otherwise, prompt the user for a hostname
  output.print('Your project has not been assigned a studio hostname.')
  output.print('To deploy your Sanity Studio to our hosted Sanity.Studio service,')
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
        const response = await createUserApplication(client, {appHost, isDefault: true})
        resolve(response)
        return true
      } catch (e) {
        // if the name is taken, it should return a 409 so we relay to the user
        if (e?.statusCode === 409) return e?.message || 'Conflict' // just in case

        // otherwise, it's a fatal error
        throw e
      }
    },
  })

  return await promise
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
}: CreateDeploymentOptions): Promise<void> {
  const config = client.config()

  const formData = new FormData()
  formData.append('isAutoUpdating', isAutoUpdating.toString())
  formData.append('version', version)
  formData.append('tarball', tarball, {contentType: 'application/gzip'})

  const url = new URL(client.getUrl(`/user-applications/${applicationId}/deployments`))
  const headers = new Headers({
    ...(config.token && {Authorization: `Bearer ${config.token}`}),
  })

  await fetch(url, {
    method: 'POST',
    headers,
    // NOTE:
    // - the fetch API in node.js supports streams but it's not in the types
    // - the PassThrough is required because `form-data` does not fully conform
    //   to the node.js stream API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: formData.pipe(new PassThrough()) as any,
    // @ts-expect-error the `duplex` param is required in order to send a stream
    // https://github.com/nodejs/node/issues/46221#issuecomment-1383246036
    duplex: 'half',
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
