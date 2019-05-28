import generateHelpUrl from '@sanity/generate-help-url'
import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'
import sanityClient, {SanityClient} from '@sanity/client'

const fallbackConfig = {projectId: 'UNSPECIFIED', dataset: 'UNSPECIFIED'}
const apiConfig = {
  ...fallbackConfig,
  ...config.api,
  withCredentials: true,
  useCdn: false,
  apiVersion: '1',
}

const client = sanityClient(apiConfig)
const configuredClient = experimental(
  configureClient ? configureClient(sanityClient(apiConfig)) : client
)

const getKeys = (obj) => Object.keys(Object.getPrototypeOf(obj)).concat(Object.keys(obj))
const instances = [configuredClient]

const wrappedClient = {
  config(newConfig, silence = false) {
    if (!newConfig) {
      return configuredClient.config()
    }

    if (!silence) {
      // eslint-disable-next-line no-console
      console.warn(
        new Error(
          `Setting configuration on the global studio client is deprecated - please use \`withConfig()\` instead - see ${generateHelpUrl(
            'studio-client-global-config'
          )}`
        )
      )
    }

    // Don't allow overriding apiVersion on instantiated clients
    const {apiVersion, ...rest} = newConfig
    instances.forEach((instance) => instance.config(rest))
    return wrappedClient
  },

  withConfig: (newConfig) => {
    if (!newConfig || !newConfig.apiVersion) {
      throw new Error(
        `Client \`withConfig()\` called without an \`apiVersion\` - see ${generateHelpUrl(
          'studio-client-specify-api-version'
        )}`
      )
    }

    const newClient = configuredClient.clone().config(newConfig)
    instances.push(newClient)
    return newClient
  },
}

function experimental(original: SanityClient): SanityClient {
  let useExperimental = false
  try {
    useExperimental = Boolean(window.localStorage.vx)
  } catch (err) {
    // nah
  }

  if (!useExperimental) {
    return original
  }

  ;[original.clientConfig as any, original.observable.clientConfig as any].forEach((cfg) => {
    cfg.url = cfg.url.replace(/\/v1$/, '/vX')
    cfg.cdnUrl = cfg.cdnUrl.replace(/\/v1$/, '/vX')
  })

  return original
}

getKeys(configuredClient).forEach((key) => {
  if (key === 'config') {
    return
  }

  Object.defineProperty(wrappedClient, key, {
    get() {
      // eslint-disable-next-line no-console
      console.warn(
        // Using Error to get a stack that makes it easier to see where it originates from
        new Error(
          `Used property "${key}" on versionless client - this is deprecated. Please specify API version using \`withConfig\` - see ${generateHelpUrl(
            'studio-client-specify-api-version'
          )}`
        )
      )

      return configuredClient[key]
    },
  })
})

// Expose as CJS to allow Node scripts to consume it without `.default`
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = configuredClient
