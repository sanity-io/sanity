import {SanityClient} from '@sanity/client'
import {Button, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {Observable} from 'rxjs'
import {createHookFromObservableFactory} from '../../../util'
import {providerLogos} from './providerLogos'
import {LoginComponentProps} from './types'

interface GetProvidersOptions {
  client: SanityClient
  mode?: 'append' | 'replace'
  providers?: Array<{
    name: string
    title: string
    url: string
    logo?: string
  }>
}

interface ProvidersResponse {
  thirdPartyLogin?: boolean
  sso?: {
    saml?: boolean
  }
  providers: Provider[]
}

interface Provider {
  name: string
  title: string
  url: string
}

async function getProviders({client, mode, providers: customProviders = []}: GetProvidersOptions) {
  const {providers, thirdPartyLogin, sso} = await client.request<ProvidersResponse>({
    uri: '/auth/providers',
  })

  if (!customProviders.length) return providers

  const custom = customProviders.map((provider) => {
    // taken from here:
    // https://github.com/sanity-io/sanity/blob/795637999b67c23de1657a3701091a337383f632/packages/%40sanity/default-login/src/util/getProviders.js#L19
    // A user may want to remove certain login options (eg GitHub) and thus
    // provide "official" login options through the config. These shouldn't be
    // treated as custom login providers which require the third-party login
    // feature, but as the official provider
    const isOfficial = providers.some((official) => official.url === provider.url)
    const isSupported = isOfficial || thirdPartyLogin || (sso && Object.values(sso).some(Boolean))
    return {...provider, custom: !isOfficial, supported: isSupported}
  })

  if (mode === 'replace') return custom

  // Append to the list of official providers, but replace any provider that has
  // the same URL with the custom one (allows customizing the title, name)
  return providers
    .filter((official) => custom.some((provider) => provider.url !== official.url))
    .concat(custom)
}

interface CreateLoginComponentOptions {
  getClient: () => Observable<SanityClient>
  loginMethod: 'dual' | 'cookie'
  mode?: 'append' | 'replace'
  redirectOnSingle?: boolean
  providers?: Array<{
    name: string
    title: string
    url: string
    logo?: string
  }>
}

interface CreateHrefForProviderOptions {
  projectId: string
  loginMethod: 'dual' | 'cookie'
  url: string
  basePath: string
}

function createHrefForProvider({
  loginMethod,
  projectId,
  url,
  basePath,
}: CreateHrefForProviderOptions) {
  const params = new URLSearchParams()
  params.set('origin', `${window.location.origin}${basePath}`)
  params.set('projectId', projectId)
  params.set('type', loginMethod)
  return `${url}?${params}`
}

export function createLoginComponent({
  getClient,
  loginMethod,
  redirectOnSingle,
  ...providerOptions
}: CreateLoginComponentOptions) {
  const useClient = createHookFromObservableFactory(getClient)

  function LoginComponent({projectId, basePath}: LoginComponentProps) {
    const [providers, setProviders] = useState<Provider[] | null>(null)
    const [error, setError] = useState<unknown>(null)
    if (error) throw error

    const [client] = useClient()

    useEffect(() => {
      if (!client) return

      getProviders({client, ...providerOptions})
        .then(setProviders)
        .catch(setError)
    }, [client])

    // only create a direct URL if `redirectOnSingle` is true and there is only
    // one provider available
    const redirectUrl =
      redirectOnSingle &&
      providers?.length === 1 &&
      providers?.[0] &&
      createHrefForProvider({
        loginMethod,
        projectId,
        url: providers[0].url,
        basePath,
      })

    const loading = !providers || redirectUrl

    useEffect(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl
      }
    }, [redirectUrl])

    if (loading) {
      return (
        <Flex
          align="center"
          direction="column"
          gap={4}
          justify="center"
          padding={6}
          sizing="border"
        >
          <Text muted>Loading…</Text>
          <Spinner muted />
        </Flex>
      )
    }

    return (
      <Stack space={4}>
        <Heading align="center" size={1}>
          Choose login provider
        </Heading>

        <Stack space={2}>
          {providers.map((provider, index) => (
            <Button
              // eslint-disable-next-line react/no-array-index-key
              icon={providerLogos[provider.name]}
              key={`${provider.url}_${index}`}
              as="a"
              href={createHrefForProvider({
                loginMethod,
                projectId,
                url: provider.url,
                basePath,
              })}
              mode="ghost"
              text={provider.title}
            />
          ))}
        </Stack>
      </Stack>
    )
  }

  return LoginComponent
}
