import {SanityClient} from '@sanity/client'
import {Box, Button, Flex, Heading, Spinner, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {Observable} from 'rxjs'
import styled from 'styled-components'
import {createHookFromObservableFactory} from '../../util'
import {LoginComponentProps} from './types'

const IconWrapperBig = styled(Box)`
  width: 64px;
  height: 64px;
  align-self: center;
  & > * {
    width: 100%;
  }
`

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

  function LoginComponent({projectId, title, icon, basePath}: LoginComponentProps) {
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

    useEffect(() => {
      if (redirectUrl) {
        window.location.href = redirectUrl
      }
    }, [redirectUrl])

    if (!providers || redirectUrl) {
      return (
        <Flex
          justify="center"
          align="center"
          direction="column"
          gap={4}
          padding={4}
          // this matches the height of the default fully loaded login component
          // with the typical 3 providers. if more or less providers are
          // provided, there will be a slight layout shift
          style={{minHeight: 208}}
        >
          <Text muted>Loading…</Text>
          <Spinner muted />
        </Flex>
      )
    }

    return (
      <>
        <Flex
          justify="center"
          direction="column"
          paddingX={4}
          paddingTop={4}
          marginBottom={2}
          gap={2}
        >
          <IconWrapperBig>{icon}</IconWrapperBig>
          <Heading size={1} align="center" as="h1">
            Sign in to {title}
          </Heading>
        </Flex>
        <Flex gap={2} padding={2} direction="column">
          {providers.map((provider, index) => (
            <Button
              // eslint-disable-next-line react/no-array-index-key
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
        </Flex>
      </>
    )
  }

  return LoginComponent
}
