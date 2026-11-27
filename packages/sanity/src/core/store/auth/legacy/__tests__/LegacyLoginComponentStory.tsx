import {type AuthProvider, createClient} from '@sanity/client'
import {Card, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {of} from 'rxjs'
import {Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createLoginComponent} from '../createLoginComponent'

// A static provider list replaces the `/auth/providers` request, so the client is never used.
const client$ = of(
  createClient({projectId: 'test', dataset: 'test', apiVersion: '2025-02-19', useCdn: false}),
)

const PROVIDERS: AuthProvider[] = [
  {name: 'google', title: 'Google', url: 'https://api.sanity.io/v1/auth/login/google'},
  {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
  {name: 'sanity', title: 'E-mail / password', url: 'https://api.sanity.io/v1/auth/login/sanity'},
  {name: 'company-sso', title: 'Company SSO', url: 'https://sso.example.com/login'},
]

const options = {client$, wasLogout: () => false, isHandlingCallback: () => false}
const LoginWithProviders = createLoginComponent({...options, providers: PROVIDERS})
const LoginWithoutProviders = createLoginComponent({...options, providers: []})

/**
 * Chromatic sentinel for the legacy auth store's login chooser: the heading and provider
 * buttons, and the caution card shown when `auth.providers` resolves to an empty list.
 */
export function LegacyLoginComponentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Flex gap={4} alignItems="flex-start">
        <VStack gap={2} style={{width: 360}}>
          <Text muted size={1} weight="medium">
            providers
          </Text>
          <Card padding={4} radius={2} shadow={1}>
            <LoginWithProviders projectId="test" redirectPath="/" />
          </Card>
        </VStack>
        <VStack gap={2} style={{width: 360}}>
          <Text muted size={1} weight="medium">
            no providers
          </Text>
          <LoginWithoutProviders
            projectId="test"
            redirectPath="/"
            onChooseAnotherWorkspace={noop}
          />
        </VStack>
      </Flex>
    </TestWrapper>
  )
}
