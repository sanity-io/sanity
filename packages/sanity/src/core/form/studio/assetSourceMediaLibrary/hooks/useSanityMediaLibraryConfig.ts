import {useClient} from '../../../../hooks/useClient'
import {
  API_HOST_PRODUCTION,
  API_HOST_STAGING,
  CDN_HOST_PRODUCTION,
  CDN_HOST_STAGING,
  DEFAULT_API_VERSION,
  DEPLOYED_FRONTEND_HOST_PRODUCTION,
  DEPLOYED_FRONTEND_HOST_STAGING,
  IS_LOCAL_DEV,
  LOCAL_DEV_FRONTEND_HOST,
} from '../constants'
import {type SanityMediaLibraryConfig} from '../types'

export function useSanityMediaLibraryConfig(): SanityMediaLibraryConfig {
  const isLocalDev = IS_LOCAL_DEV
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const host = client.config().apiHost
  const isStaging = host.endsWith('sanity.work')
  const deployedFrontendHost = isStaging
    ? DEPLOYED_FRONTEND_HOST_STAGING
    : DEPLOYED_FRONTEND_HOST_PRODUCTION
  const appHost = isLocalDev ? LOCAL_DEV_FRONTEND_HOST : deployedFrontendHost
  const env: 'staging' | 'production' = isStaging ? 'staging' : 'production'

  const internalConfig = {
    apiVersion: DEFAULT_API_VERSION,
    appBasePath: '',
    hosts: {
      cdn: isStaging ? CDN_HOST_STAGING : CDN_HOST_PRODUCTION,
      app: appHost,
      api: isStaging ? API_HOST_STAGING : API_HOST_PRODUCTION,
    },
    isLocalDev,
    env,
  }

  return {
    __internal: internalConfig,
  }
}
