// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

/**
 * This is the client exposed as `part:@sanity/base/client`, used as:
 *
 * ```ts
 * import sanityClient from 'part:@sanity/base/client'
 *
 * const client = sanityClient.withConfig({apiVersion: '1'})
 * client.fetch(...)
 * ```
 */
import sanityClient, {ClientConfig, SanityClient} from '@sanity/client'
import {generateHelpUrl} from '@sanity/generate-help-url'
import config from 'config:sanity'
import configureClient from 'part:@sanity/base/configure-client?'
import {authToken$} from '../datastores/authState'

const fallbackConfig = {projectId: 'UNSPECIFIED', dataset: 'UNSPECIFIED'}
const apiConfig = {
  ...fallbackConfig,
  ...config.api,
  requestTagPrefix: 'sanity.studio',
  withCredentials: true,
  useCdn: false,
  apiVersion: '1',
}

const client = sanityClient(apiConfig)
const configuredClient = configureClient ? configureClient(sanityClient(apiConfig)) : client

const getKeys = (obj) => Object.keys(Object.getPrototypeOf(obj)).concat(Object.keys(obj))
const instances = [configuredClient]

export const wrappedClient = {
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
    return configuredClient
  },

  get clientConfig() {
    return configuredClient.clientConfig
  },

  withConfig: (newConfig: Partial<ClientConfig>): SanityClient => {
    if (!newConfig || !newConfig.apiVersion) {
      throw new Error(
        `Client \`withConfig()\` called without an \`apiVersion\` - see ${generateHelpUrl(
          'studio-client-specify-api-version'
        )}`
      )
    }
    const newClient = configuredClient.clone().config(newConfig)
    instances.push(newClient)
    // Subscribe to auth token stream and configure the client depending on token value unless the client was originally configured with a token.
    const preconfiguredToken = Boolean(configuredClient.config().token)
    if (!preconfiguredToken) {
      authToken$.subscribe((token) => {
        const currentHasToken = Boolean(newClient.config().token)
        const nextHasToken = Boolean(token)
        if (currentHasToken !== nextHasToken) {
          newClient.config({...newConfig, token, ignoreBrowserTokenWarning: true})
        }
      })
    }
    return newClient
  },
}

getKeys(configuredClient).forEach((key) => {
  if (key === 'config' || key === 'clientConfig' || key === 'withConfig') {
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

      return typeof configuredClient[key] === 'function'
        ? configuredClient[key].bind(configuredClient)
        : configuredClient[key]
    },
  })
})
