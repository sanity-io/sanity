import {Card} from '@sanity/ui'
import {of} from 'rxjs'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createOAuthLoginComponent} from '../createOAuthLoginComponent'

// The authorization server never answers here, so a click leaves the button in its redirecting
// state instead of navigating away.
const OAuthLoginComponent = createOAuthLoginComponent({login: () => new Promise(() => {})})

const InvalidTargetLogin = createOAuthLoginComponent({
  login: () => new Promise(() => {}),
  callbackError$: of({error: 'invalid_target'}),
})

const AuthorizationRefusedLogin = createOAuthLoginComponent({
  login: () => new Promise(() => {}),
  callbackError$: of({
    description: 'The resource owner denied the request.',
    error: 'access_denied',
  }),
})

const GenericCallbackLogin = createOAuthLoginComponent({
  login: () => new Promise(() => {}),
  callbackError$: of({error: 'temporarily_unavailable'}),
})

/**
 * Chromatic sentinel for the login screen of a Studio that signs in with OAuth
 * (`auth.experimental_oauth`): the heading and the full-width sign-in button, idle or redirecting.
 * Shared with Storybook via a thin CSF wrapper.
 */
export function OAuthLoginComponentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <OAuthLoginComponent projectId="test-project" redirectPath="/" />
      </Card>
    </TestWrapper>
  )
}

/**
 * Chromatic sentinel for the critical error Cards on that same screen: the
 * studio-authored invalid_target hint plus error code, a server description
 * plus error code, and a generic code-only body with no muted code line.
 */
export function OAuthLoginErrorsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              invalid target
            </Text>
            <InvalidTargetLogin projectId="test-project" redirectPath="/" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              authorization refused
            </Text>
            <AuthorizationRefusedLogin projectId="test-project" redirectPath="/" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              generic callback error
            </Text>
            <GenericCallbackLogin projectId="test-project" redirectPath="/" />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
