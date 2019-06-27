import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'
import sanityClient from '@sanity/client'

const deprecationMessage = `[deprecation] The Sanity client is now exposed in CommonJS format.

For instance, change:
  \`const client = require('part:@sanity/base/client').default\`

To the following:
  \`const client = require('part:@sanity/base/client')\`
`

const fallbackConfig = {projectId: 'UNSPECIFIED', dataset: 'UNSPECIFIED'}
const apiConfig = {...fallbackConfig, ...config.api, withCredentials: true, useCdn: false}
const client = sanityClient(apiConfig)

const configuredClient = configureClient ? configureClient(sanityClient(apiConfig)) : client

// Warn when people use `.default`
Object.defineProperty(configuredClient, 'default', {
  get() {
    // eslint-disable-next-line no-console
    console.warn(deprecationMessage)
    return configuredClient
  }
})

// Expose as CJS to allow Node scripts to consume it without `.default`
// eslint-disable-next-line import/no-commonjs
module.exports = configuredClient
