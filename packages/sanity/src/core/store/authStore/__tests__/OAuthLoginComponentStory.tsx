import {Card} from '@sanity/ui'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createOAuthLoginComponent} from '../createOAuthLoginComponent'

// The authorization server never answers here, so a click leaves the button in its redirecting
// state instead of navigating away.
const OAuthLoginComponent = createOAuthLoginComponent({login: () => new Promise(() => {})})

/**
 * Chromatic sentinel for the login screen of a Studio that signs in with OAuth
 * (`auth.unstable_oauth`): the heading and the full-width sign-in button, idle or redirecting.
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
