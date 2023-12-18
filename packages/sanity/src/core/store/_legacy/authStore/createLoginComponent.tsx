/* eslint-disable i18next/no-literal-string */
import type {AuthProvider, AuthProviderResponse, SanityClient} from '@sanity/client'
import {Heading, Stack} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import type {Observable} from 'rxjs'
import type {AuthConfig} from '../../../config'
import {createHookFromObservableFactory} from '../../../util'
import {Button} from '../../../../ui-components'
import {LoadingBlock} from '../../../components/loadingBlock'
import {CustomLogo, providerLogos} from './providerLogos'
import type {LoginComponentProps} from './types'

interface GetProvidersOptions extends AuthConfig {
  client: SanityClient
}

async function getProviders({
  client,
  mode,
  providers: customProviders = [],
}: GetProvidersOptions): Promise<AuthProvider[]> {
  // Short-circuit if we're in replace mode without needing the default providers
  if (mode === 'replace' && Array.isArray(customProviders)) {
    return customProviders
  }

  const {providers} = await client.request<AuthProviderResponse>({
    uri: '/auth/providers',
  })

  // If a custom reducer function is passed, allow it to modify the default list of providers
  // any way it wants - eg replace, append, remove etc.
  if (typeof customProviders === 'function') {
    return customProviders(providers)
  }

  // If no providers are specified, use the default list
  if (customProviders.length === 0) {
    return providers
  }

  // -- Note: Deprecated flow below: we now prefer the reducer pattern above --
  // Replace mode: use the provided list as-is
  if (mode === 'replace') {
    return customProviders
  }

  // Append mode (default):
  // Append to the list of official providers, but replace any provider that has
  // the same URL with the custom one (allows customizing the title, name)
  return providers
    .filter((official) => customProviders.some((provider) => provider.url !== official.url))
    .concat(customProviders)
}

interface CreateLoginComponentOptions extends AuthConfig {
  getClient: () => Observable<SanityClient>
}

interface CreateHrefForProviderOptions {
  basePath: string
  loginMethod: AuthConfig['loginMethod']
  projectId: string
  url: string
}

function createHrefForProvider({
  loginMethod = 'dual',
  projectId,
  url,
  basePath,
}: CreateHrefForProviderOptions) {
  const params = new URLSearchParams()
  params.set('origin', `${window.location.origin}${basePath}`)
  params.set('projectId', projectId)

  // Setting `type=token` will return the sid as part of the _query_, which may end up in
  // server access logs and similar. Instead, use `withSid=true` to return the sid as part
  // of the _hash_ instead, which is only accessible to the client. Other auth types will
  // use the `type` parameter - `dual` will automatically use the hash, so do not need the
  // additional parameter.
  if (loginMethod === 'token') {
    params.set('withSid', 'true')
  } else {
    params.set('type', loginMethod)
  }
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
    const [providers, setProviders] = useState<AuthProvider[] | null>(null)
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
      return <LoadingBlock showText />
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
              key={`${provider.url}_${index}`}
              as="a"
              icon={providerLogos[provider.name] || <CustomLogo provider={provider} />}
              href={createHrefForProvider({
                loginMethod,
                projectId,
                url: provider.url,
                basePath,
              })}
              mode="ghost"
              size="large"
              text={provider.title}
            />
          ))}
        </Stack>
      </Stack>
    )
  }

  return LoginComponent
}
