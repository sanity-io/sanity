/* eslint-disable i18next/no-literal-string */
import {type AuthProvider, type AuthProviderResponse, type SanityClient} from '@sanity/client'
import {Badge, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {type Observable} from 'rxjs'

import {Button, type ButtonProps} from '../../../../ui-components'
import {LoadingBlock} from '../../../components/loadingBlock'
import {type AuthConfig} from '../../../config'
import {createHookFromObservableFactory} from '../../../util'
import {CustomLogo, providerLogos} from './providerLogos'
import {type LoginComponentProps} from './types'

const SANITY_LAST_USED_PROVIDER_KEY = 'sanity:last_used_provider'

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
  redirectPath: string
  loginMethod: AuthConfig['loginMethod']
  projectId: string
  url: string
}

function createHrefForProvider({
  loginMethod = 'dual',
  projectId,
  url,
  redirectPath,
}: CreateHrefForProviderOptions) {
  const params = new URLSearchParams()
  params.set('origin', `${window.location.origin}${redirectPath}`)
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

  function LoginComponent({projectId, ...props}: LoginComponentProps) {
    const redirectPath = props.redirectPath || props.basePath || '/'

    const [providerData, setProviderData] = useState<{
      providers: AuthProvider[]
      lastUsedProvider?: AuthProvider
      isLoading: boolean
    }>({
      providers: [],
      isLoading: true,
    })

    const [error, setError] = useState<unknown>(null)
    if (error) throw error

    const [client] = useClient()

    const getProviderData = useCallback(async () => {
      let providers = [] as AuthProvider[]

      if (!client) return []

      try {
        providers = await getProviders({client, ...providerOptions})
      } catch (err) {
        setError(err)
      }

      return providers
    }, [client])

    const getLastUsedProvider = useCallback((providerList: AuthProvider[]) => {
      // only set last used provider if there are mutiple providers
      if (!providerList || providerList.length <= 1) return undefined
      const providerName = localStorage.getItem(SANITY_LAST_USED_PROVIDER_KEY)
      return providerList?.find(({name}) => name === providerName)
    }, [])

    useEffect(() => {
      if (!client) return

      const setup = async () => {
        const providers = await getProviderData()
        const lastUsedProvider = getLastUsedProvider(providers)
        setProviderData({providers, lastUsedProvider, isLoading: false})
      }

      setup()
    }, [client, getLastUsedProvider, getProviderData])

    const {providers, lastUsedProvider, isLoading} = providerData

    // only create a direct URL if `redirectOnSingle` is true and there is only
    // one provider available
    const redirectUrlForRedirectOnSingle =
      redirectOnSingle &&
      providers?.length === 1 &&
      providers?.[0] &&
      createHrefForProvider({
        loginMethod,
        projectId,
        url: providers[0].url,
        redirectPath,
      })

    const loading = isLoading || redirectUrlForRedirectOnSingle

    const providerList = providers.filter(({name}) => name !== lastUsedProvider?.name)

    useEffect(() => {
      if (redirectUrlForRedirectOnSingle) {
        window.location.href = redirectUrlForRedirectOnSingle
      }
    }, [redirectUrlForRedirectOnSingle])

    if (loading) {
      return <LoadingBlock showText />
    }

    return (
      <Stack gap={4}>
        <Heading align="center" size={1}>
          Choose login provider
        </Heading>

        <Stack>
          {lastUsedProvider && (
            <LastUsedProviderButton
              provider={lastUsedProvider}
              href={createHrefForProvider({
                loginMethod,
                projectId,
                url: lastUsedProvider.url,
                redirectPath,
              })}
            />
          )}

          <Stack gap={2}>
            {providerList?.map((provider, index) => (
              <ProviderButton
                key={`${provider.url}_${index}`}
                provider={provider}
                href={createHrefForProvider({
                  loginMethod,
                  projectId,
                  url: provider.url,
                  redirectPath,
                })}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    )
  }

  return LoginComponent
}

function LastUsedProviderButton(props: {href: string; provider: AuthProvider}) {
  return (
    <Flex direction="column" style={{width: '100%'}}>
      <Badge radius={2} tone="primary" style={{alignSelf: 'start', marginBottom: '8px'}}>
        Last used
      </Badge>
      <ProviderButton autoFocus tone="primary" {...props} />
      <Text size={0} align="center" style={{margin: '13px 0 13px 0'}}>
        OR
      </Text>
    </Flex>
  )
}

function ProviderButton({
  href,
  provider,
  tone = 'default',
  autoFocus = false,
}: {
  href: string
  provider: AuthProvider
  tone?: ButtonProps['tone']
  autoFocus?: boolean
}) {
  const focusRef = useCallback(
    (node: HTMLAnchorElement) => {
      if (autoFocus) node?.focus()
    },
    [autoFocus],
  )

  const handleProviderSelect = useCallback(() => {
    localStorage.setItem(SANITY_LAST_USED_PROVIDER_KEY, provider.name)
  }, [provider])

  const ProviderLogo = providerLogos[provider.name] || CustomLogo

  return (
    <Button
      ref={focusRef}
      as="a"
      href={href}
      mode="ghost"
      size="large"
      tone={tone}
      style={{width: '100%'}}
      text={provider.title}
      icon={<ProviderLogo provider={provider} />}
      onClick={handleProviderSelect}
    />
  )
}
