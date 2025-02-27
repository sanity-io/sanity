import {useClient} from '../../../../../core/hooks'
import {isDev} from '../../../../environment'
import {DEFAULT_API_VERSION} from '../constants'
import {type SanityAssetLibraryConfig} from '../types'

// TODO: figure out how to configure this stuff

const IS_LOCAL_DEV = false && isDev // Set to true to work against local Asset Library dev server

export function useSanityAssetLibraryConfig(): SanityAssetLibraryConfig {
  const isLocalDev = IS_LOCAL_DEV
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const host = client.config().apiHost
  const isStaging = host.includes('sanity.work')
  const deployedFrontendHost = isStaging ? 'https://www.sanity.work' : 'https://www.sanity.io'
  const appHost = isLocalDev ? 'http://localhost:3001' : deployedFrontendHost
  const env: 'staging' | 'production' = isStaging ? 'staging' : 'production'

  const internalConfig = {
    apiVersion: DEFAULT_API_VERSION,
    appBasePath: '/app/asset-libraries',
    pluginApiVersion: 'v1',
    hosts: {
      cdn: isStaging ? 'https://sanity-cdn.work' : 'https://sanity-cdn.com',
      app: appHost,
      api: isStaging ? 'https://api.sanity.work' : 'https://api.sanity.io',
    },
    isLocalDev,
    env,
  }

  return {
    __internal: internalConfig,
  }
}
