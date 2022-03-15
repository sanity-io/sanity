import {SanityClient} from '@sanity/client'
import {of, Observable} from 'rxjs'
import {catchError, map} from 'rxjs/operators'
import {SanityAuthConfig} from '../config'
import {SanityAuthProvider, SanityUser} from './types'

export interface AuthController {
  getCurrentUser: () => Observable<SanityUser | null>
  getProviders: () => Observable<SanityAuthProvider[]>
  logout: () => Promise<void>
}

export function createAuthController(opts: {
  client: SanityClient
  config?: SanityAuthConfig
}): AuthController {
  const {client, config} = opts
  const customProviders = config?.providers || []
  const versionedClient = client.withConfig({apiVersion: '2021-10-01'})

  return {
    getProviders: () => {
      return versionedClient.observable
        .request({
          uri: '/auth/providers',
          withCredentials: true,
        })
        .pipe(
          map((res: {providers: any[]; thirdPartyLogin: boolean; sso: Record<string, unknown>}) => {
            const {providers, thirdPartyLogin, sso} = res

            if (customProviders.length === 0) {
              return providers as SanityAuthProvider[]
            }

            const custom: SanityAuthProvider[] = customProviders.map((provider) => {
              // A user may want to remove certain login options (eg GitHub) and thus provide "official"
              // login options through the config. These shouldn't be treated as custom login providers
              // which require the third-party login feature, but as the official provider
              const isOfficial = providers.some((official) => official.url === provider.url)
              const isSupported =
                isOfficial || thirdPartyLogin || (sso && Object.values(sso).some(Boolean))

              return {...provider, custom: !isOfficial, supported: isSupported}
            })

            if (config?.mode === 'replace') {
              return custom
            }

            // Append to the list of official providers, but replace any provider that has
            // the same URL with the custom one (allows customizing the title, name)
            return providers
              .filter((official) => custom.some((provider) => provider.url !== official.url))
              .concat(custom) as SanityAuthProvider[]
          })
        )
    },

    getCurrentUser: () =>
      versionedClient.observable
        .request({
          uri: '/users/me',
          withCredentials: true,
          tag: 'users.get-current',
        })
        .pipe(
          map((user) => {
            return user?.id ? user : null
          }),
          catchError((err) => {
            if (err.statusCode === 401) {
              return of(null)
            }

            throw err
          })
        ),

    logout: () => versionedClient.auth.logout(),
  }
}
