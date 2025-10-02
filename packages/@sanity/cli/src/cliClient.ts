import {createClient, type SanityClient} from '@sanity/client'

import {getSanityCliConfig} from './util/getCliConfig'
import {resolveRootDir} from './util/resolveRootDir'

export interface CliClientOptions {
  cwd?: string

  projectId?: string
  dataset?: string
  useCdn?: boolean
  token?: string
  apiVersion?: string
  apiHost?: string
}

interface GetCliClient {
  (options?: CliClientOptions): SanityClient
  /**
   * @internal
   * @deprecated This is only for INTERNAL use, and should not be relied upon outside of official Sanity modules
   * @returns A token to use when constructing a client without a `token` explicitly defined, or undefined
   */
  __internal__getToken: (apiHost?: string) => string | undefined
}

function getCliClientImpl(options: CliClientOptions = {}): SanityClient {
  if (typeof process !== 'object') {
    throw new Error('getCliClient() should only be called from node.js scripts')
  }

  const {
    cwd = process.env.SANITY_BASE_PATH || process.cwd(),
    useCdn = false,
    apiVersion = '2022-06-06',
    projectId,
    dataset,
    apiHost,
    token = getCliClient.__internal__getToken(options.apiHost),
  } = options

  if (projectId && dataset) {
    return createClient({projectId, dataset, apiVersion, useCdn, token, apiHost})
  }

  const rootDir = resolveRootDir(cwd)
  const {config} = getSanityCliConfig(rootDir) || {}
  if (!config) {
    throw new Error('Unable to resolve CLI configuration')
  }

  const apiConfig = config?.api || {}
  if (!apiConfig.projectId || !apiConfig.dataset) {
    throw new Error('Unable to resolve project ID/dataset from CLI configuration')
  }

  return createClient({
    projectId: apiConfig.projectId,
    dataset: apiConfig.dataset,
    apiVersion,
    apiHost,
    useCdn,
    token,
  })
}

/* eslint-disable camelcase */
getCliClientImpl.__internal__getToken = (): string | undefined => undefined
/* eslint-enable camelcase */

/** @internal */
export const getCliClient: GetCliClient = getCliClientImpl
