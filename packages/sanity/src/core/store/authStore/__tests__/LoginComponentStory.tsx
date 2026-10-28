import {type SanityClient} from '@sanity/client'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {of} from 'rxjs'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type AuthProvider} from '../../../config/auth/types'
import {createLoginComponent} from '../createLoginComponent'

const PROVIDERS: AuthProvider[] = [
  {name: 'google', title: 'Google', url: 'https://api.sanity.io/v1/auth/login/google'},
  {name: 'github', title: 'GitHub', url: 'https://api.sanity.io/v1/auth/login/github'},
  {name: 'sanity', title: 'E-mail / password', url: 'https://api.sanity.io/v1/auth/login/sanity'},
]

// A static `providers` array skips the /auth/providers request, so the client
// only has to exist for the component to leave its loading state.
const client$ = of({} as SanityClient)
const FALSE = () => false

const ProviderChooser = createLoginComponent({
  client$,
  providers: PROVIDERS,
  wasLogout: FALSE,
  isHandlingCallback: FALSE,
})

const NoProviders = createLoginComponent({
  client$,
  providers: [],
  wasLogout: FALSE,
  isHandlingCallback: FALSE,
})

/**
 * Chromatic sentinel for the login screen built by `createLoginComponent`:
 * the "Choose login provider" heading over full-width ghost provider buttons
 * with their logos, and the caution card shown when `auth.providers`
 * resolves to an empty list (with the choose-another-workspace action).
 * Providers are static fixtures, so nothing is fetched; the "Last used"
 * badge depends on localStorage and is not rendered.
 */
export function LoginComponentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              provider chooser
            </Text>
            <ProviderChooser projectId="ppsg7ml5" redirectPath="/" />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              no providers configured
            </Text>
            <NoProviders projectId="ppsg7ml5" redirectPath="/" onChooseAnotherWorkspace={noop} />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
