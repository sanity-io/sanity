import pluginConfig from 'config:@sanity/default-login'
import {versionedClient} from '../versionedClient'

export default function getProviders() {
  const config = pluginConfig || {}
  return versionedClient
    .request({
      uri: '/auth/providers',
      withCredentials: true,
    })
    .then((res) => {
      const {providers, thirdPartyLogin, sso} = res
      const customProviders = (config.providers && config.providers.entries) || []
      if (customProviders.length === 0) {
        return providers
      }

      const custom = customProviders.map((provider) => {
        // A user may want to remove certain login options (eg GitHub) and thus provide "official"
        // login options through the config. These shouldn't be treated as custom login providers
        // which require the third-party login feature, but as the official provider
        const isOfficial = providers.some((official) => official.url === provider.url)
        const isSupported =
          isOfficial || thirdPartyLogin || (sso && Object.values(sso).some(Boolean))
        return {...provider, custom: !isOfficial, supported: isSupported}
      })

      if (config.providers.mode === 'replace') {
        return custom
      }

      // Append to the list of official providers, but replace any provider that has
      // the same URL with the custom one (allows customizing the title, name)
      return providers
        .filter((official) => custom.some((provider) => provider.url !== official.url))
        .concat(custom)
    })
}
