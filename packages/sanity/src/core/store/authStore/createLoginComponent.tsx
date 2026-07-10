/* oxlint-disable i18next/no-literal-string */
import {type AuthProvider, type AuthProviderResponse, type SanityClient} from '@sanity/client'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Box, Card, Flex, Heading, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {Button, type ButtonProps} from '../../../ui-components'
import {LoadingBlock} from '../../components/loadingBlock'
import {type AuthConfig} from '../../config'
import {useTranslation} from '../../i18n'
import {CustomLogo, providerLogos} from './providerLogos'
import {type LoginComponentProps} from './types'

const SANITY_LAST_USED_PROVIDER_KEY = 'sanity:last_used_provider'

interface GetProvidersOptions extends AuthConfig {
  client: SanityClient
}

/** @internal */
export async function getProviders({
  client,
  providers: customProviders,
}: GetProvidersOptions): Promise<AuthProvider[]> {
  // If a static array is provided, use it as-is (replaces defaults) and skip
  // the /auth/providers request entirely.
  if (Array.isArray(customProviders)) {
    return customProviders
  }

  // Fetch providers without credentials. `/auth/providers` doesn't require
  // auth, and including a now-expired credential here causes the server to
  // 401 the request, which would surface as a generic error boundary to a
  // user who simply needs to log in again. Stripping the token + cookie
  // sidesteps that — anonymous callers get the public provider list.
  const credentiallessClient = client.withConfig({token: undefined, withCredentials: false})
  const {providers} = await credentiallessClient.request<AuthProviderResponse>({
    uri: '/auth/providers',
  })

  return customProviders
    ? // If a custom reducer function is passed, allow it to modify the default list of providers
      // any way it wants - eg replace, append, remove etc.
      customProviders(providers)
    : providers
}

interface CreateLoginComponentOptions extends AuthConfig {
  client$: Observable<SanityClient>
  /**
   * Returns true if the user explicitly logged out in this session.
   * Used to suppress `redirectOnSingle` after logout — redirecting immediately
   * would log the user back in, defeating the purpose of logging out
   * (e.g. to switch accounts).
   */
  wasLogout: () => boolean
  /**
   * Returns true while a post-login callback exchange is in flight (a sid is
   * being exchanged for credentials). Used to suppress `redirectOnSingle` during
   * the exchange: the initial auth-state probe can resolve logged-out before the
   * freshly exchanged credential is applied, and redirecting then would bounce
   * back to the provider and waste a full round-trip before the login sticks.
   */
  isHandlingCallback: () => boolean
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
  client$,
  loginMethod,
  redirectOnSingle,
  wasLogout,
  isHandlingCallback,
  ...providerOptions
}: CreateLoginComponentOptions) {
  function LoginComponent({projectId, ...props}: LoginComponentProps) {
    const {t} = useTranslation()
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

    const client = useObservable(client$)

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

      void setup()
    }, [client, getLastUsedProvider, getProviderData])

    const {providers, lastUsedProvider, isLoading} = providerData

    // only create a direct URL if `redirectOnSingle` is true and there is only
    // one provider available. Skip the redirect after an explicit logout so the
    // user can pick a different account instead of being logged back in immediately.
    const redirectUrlForRedirectOnSingle =
      redirectOnSingle &&
      !wasLogout() &&
      !isHandlingCallback() &&
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

    // No providers resolved — typically a misconfiguration where `auth.providers`
    // is set to an empty array, which replaces the default providers with nothing
    // (rather than falling back to them). Surface a warning instead of an empty,
    // dead-end chooser.
    if (providers.length === 0) {
      return (
        <Card padding={4} radius={2} shadow={1} tone="caution">
          <Flex>
            <Box>
              <Text size={1}>
                <WarningOutlineIcon />
              </Text>
            </Box>
            <Stack flex={1} marginLeft={3} space={4}>
              <Text as="h1" size={1} weight="medium">
                No login providers available
              </Text>
              <Text as="p" muted size={1}>
                The <code>auth.providers</code> setting in your Studio configuration resolved to an
                empty list. An empty array replaces the default providers with none rather than
                falling back to them.
              </Text>
              <Text as="p" muted size={1}>
                Remove <code>auth.providers</code> to use the defaults, or set it to the providers
                you want.
              </Text>
              {props.onChooseAnotherWorkspace && (
                <Flex>
                  <Button
                    icon={ArrowLeftIcon}
                    mode="ghost"
                    onClick={props.onChooseAnotherWorkspace}
                    text={t('workspaces.action.choose-another-workspace')}
                  />
                </Flex>
              )}
              <Text as="p" muted size={1}>
                <a
                  href="https://www.sanity.io/docs/configuration#dc516e8cb39e"
                  rel="noreferrer"
                  target="_blank"
                >
                  Learn about auth configuration &rarr;
                </a>
              </Text>
            </Stack>
          </Flex>
        </Card>
      )
    }

    return (
      <Stack space={4}>
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

          <Stack space={2}>
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
    (node: HTMLButtonElement) => {
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
