import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'
import sanityClient, {SanityClient} from '@sanity/client'

const deprecationMessage = `[deprecation] The Sanity client is now exposed in CommonJS format.

For instance, change:
  \`const client = require('part:@sanity/base/client').default\`

To the following:
  \`const client = require('part:@sanity/base/client')\`
`

const fallbackConfig = {projectId: 'UNSPECIFIED', dataset: 'UNSPECIFIED'}
const apiConfig = {...fallbackConfig, ...config.api, withCredentials: true, useCdn: false}
const client = sanityClient(apiConfig)

const configuredClient = experimental(
  configureClient ? configureClient(sanityClient(apiConfig)) : client
)

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

// Warn when people use `.default`
Object.defineProperty(configuredClient, 'default', {
  get() {
    // eslint-disable-next-line no-console
    console.warn(deprecationMessage)
    return configuredClient
  },
})

// Expose as CJS to allow Node scripts to consume it without `.default`
// eslint-disable-next-line @typescript-eslint/no-var-requires
module.exports = configuredClient
