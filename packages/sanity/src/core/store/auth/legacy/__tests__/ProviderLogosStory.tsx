import {Card, Text as UiText} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type AuthProvider} from '../../../../config/auth/types'
import {CustomLogo, providerLogos} from '../providerLogos'

const GOOGLE: AuthProvider = {
  name: 'google',
  title: 'Google',
  url: 'https://api.sanity.io/v1/auth/login/google',
}

const GITHUB: AuthProvider = {
  name: 'github',
  title: 'GitHub',
  url: 'https://api.sanity.io/v1/auth/login/github',
}

const CUSTOM_WITH_LOGO: AuthProvider = {
  name: 'acme-sso',
  title: 'Acme SSO',
  url: 'https://sso.acme.example/login',
  // A data URL keeps the logo deterministic and off the network.
  logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 19"><rect width="19" height="19" rx="4" fill="%23f03e2f"/></svg>',
}

const CUSTOM_WITHOUT_LOGO: AuthProvider = {
  name: 'okta',
  title: 'Okta',
  url: 'https://sso.acme.example/okta',
}

function ProviderRow(props: {provider: AuthProvider; children: ReactNode}) {
  const {provider, children} = props
  return (
    <Card padding={3} border radius={2}>
      <Flex alignItems="center" gap={3}>
        <UiText size={3} data-testid={`provider-logo-${provider.name}`}>
          {children}
        </UiText>
        <UiText weight="medium">{provider.title}</UiText>
      </Flex>
    </Card>
  )
}

/**
 * Styled-components sentinel for the legacy login provider logos: the built-in
 * Google and GitHub marks, a custom provider with a data-URL logo and a custom
 * provider without one (which renders no logo at all).
 */
export function ProviderLogosStory() {
  const GoogleLogo = providerLogos.google
  const GithubLogo = providerLogos.github

  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <VStack gap={3}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            login provider logos
          </Text>
          <ProviderRow provider={GOOGLE}>
            <GoogleLogo provider={GOOGLE} />
          </ProviderRow>
          <ProviderRow provider={GITHUB}>
            <GithubLogo provider={GITHUB} />
          </ProviderRow>
          <ProviderRow provider={CUSTOM_WITH_LOGO}>
            <CustomLogo provider={CUSTOM_WITH_LOGO} />
          </ProviderRow>
          <ProviderRow provider={CUSTOM_WITHOUT_LOGO}>
            <CustomLogo provider={CUSTOM_WITHOUT_LOGO} />
          </ProviderRow>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
