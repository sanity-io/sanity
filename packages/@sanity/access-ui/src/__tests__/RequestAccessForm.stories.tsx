import {type SanityClient} from '@sanity/client'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {Grid} from 'ui5'

import {RequestAccessForm} from '../RequestAccessForm'
import {type AccessRequestEligibilityState, type AccessUser} from '../types'

const RESOURCE_ID = 'project-a'
const SSO_LOGIN_URL = 'https://www.sanity.io/login/sso/acme'
const MANAGED_SSO_LOGIN_URL = 'https://www.sanity.io/login/sso/confirm?provider=acme'

const googleUser: AccessUser = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
}

function createStoryClient(status: AccessRequestEligibilityState): SanityClient {
  const client = {
    request: (options: {url: string}) => {
      if (options.url === '/access/requests/me') return Promise.resolve([])
      if (options.url.endsWith('/requests/state')) return Promise.resolve(status)
      return Promise.reject(new Error(`Unexpected request: ${options.url}`))
    },
    withConfig: () => client,
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- minimal inert client fixture for Storybook
  return client as unknown as SanityClient
}

const states = [
  {label: 'Eligible request form', status: {state: 'eligible'}, user: googleUser},
  {
    label: 'Enforced SSO with sign-in URL',
    status: {state: 'saml-required', redirectUrl: SSO_LOGIN_URL},
    user: googleUser,
  },
  {
    label: 'Managed SSO roles with redirect',
    status: {state: 'saml-roles-managed', redirectUrl: MANAGED_SSO_LOGIN_URL},
    user: googleUser,
  },
  {label: 'Pending approval', status: {state: 'pending'}, user: googleUser},
  {label: 'Recently declined', status: {state: 'recently-declined'}, user: googleUser},
  {
    label: 'Temporarily unavailable with retry',
    status: {state: 'temporarily-unavailable'},
    user: googleUser,
  },
  {label: 'Requests disabled', status: {state: 'requests-disabled'}, user: googleUser},
] satisfies Array<{
  label: string
  status: AccessRequestEligibilityState
  user?: AccessUser
}>

const galleryStates = states.map((state) => ({...state, client: createStoryClient(state.status)}))

const meta = {
  title: 'Access/Request Access Form',
  component: RequestAccessForm,
  parameters: {layout: 'padded'},
} satisfies Meta<typeof RequestAccessForm>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  args: {client: createStoryClient({state: 'eligible'}), resourceId: RESOURCE_ID},
  render: () => (
    <Grid gap={4} gridTemplateColumns="repeat(3, minmax(0, 1fr))">
      {galleryStates.map(({client, label, user}) => (
        <Stack key={label} gap={2}>
          <Text muted size={0} weight="medium">
            {label}
          </Text>
          <Card style={{height: 460}}>
            <RequestAccessForm client={client} currentUser={user} resourceId={RESOURCE_ID} />
          </Card>
        </Stack>
      ))}
    </Grid>
  ),
}
