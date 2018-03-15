import client from 'part:@sanity/base/client'
import pluginConfig from 'config:@sanity/default-login'

export default function getProviders() {
  const config = pluginConfig || {}
  return client
    .request({
      uri: '/auth/providers',
      withCredentials: true
    })
    .then(res => {
      const {providers, thirdPartyLogin} = res
      const customProviders = (config.providers && config.providers.entries
        ? config.providers.entries
        : []
      ).map(provider => {
        provider.custom = true
        provider.supported = thirdPartyLogin
        return provider
      })
      if (customProviders.length && config.providers && config.providers.mode === 'replace') {
        return Promise.resolve(customProviders)
      }
      return providers.concat(customProviders)
    })
}
