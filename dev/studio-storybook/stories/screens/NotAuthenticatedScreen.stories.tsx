import {type CurrentUser} from '@sanity/types'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {of} from 'rxjs'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {NotAuthenticatedScreen} from '../../../../packages/sanity/src/core/studio/screens/NotAuthenticatedScreen'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * The screen reads the signed-in user off `activeWorkspace.auth.state`, an observable, and calls
 * `activeWorkspace.auth.logout()` from its one button. So the seam is the auth store, and the
 * harness seeds the CONTEXT VALUE rather than mounting `ActiveWorkspaceMatcher` itself - the
 * provider would want a router, a config resolver and a real auth flow to supply one field.
 *
 * Seeding the value is the standard move in this storybook wherever a provider demands more of
 * the world than the component demands of the provider.
 */
function withUser(user: CurrentUser | null): Decorator {
  const value = {
    activeWorkspace: {
      name: 'default',
      title: 'Acme Content',
      auth: {
        state: of({authenticated: Boolean(user), currentUser: user, client: null}),
        logout: () => undefined,
      },
    },
    setActiveWorkspace: () => undefined,
  }
  return (Story) => (
    // oxlint-disable-next-line no-unsafe-type-assertion -- only `auth` is read by this screen
    <ActiveWorkspaceMatcherContext.Provider value={value as never}>
      <Story />
    </ActiveWorkspaceMatcherContext.Provider>
  )
}

const googleUser: CurrentUser = {
  id: 'u-ada',
  name: 'Ada Okafor',
  email: 'ada@example.com',
  provider: 'google',
  // oxlint-disable-next-line no-deprecated -- role remains a required (if deprecated) field on CurrentUser; roles is also provided
  role: '',
  roles: [],
}

const samlUser: CurrentUser = {
  id: 'u-bo',
  name: 'Bo Lindqvist',
  email: 'bo@enterprise.example',
  provider: 'saml-enterprise',
  // oxlint-disable-next-line no-deprecated -- role remains a required (if deprecated) field on CurrentUser; roles is also provided
  role: '',
  roles: [],
}

const meta: Meta<typeof NotAuthenticatedScreen> = {
  title: 'Navbar & Shell/Screens/Not Authenticated',
  component: NotAuthenticatedScreen,
  /**
   * Docs-mode guard. This screen is a `Dialog`, which portals a full-viewport overlay to
   * `document.body` and mounts a focus lock. One of those is a modal; three of them on one docs
   * page (which renders every story together) bury the prose and fight over the active element.
   * That is upstream findings ledger #50, and the docs-health gate caught this one rather than a
   * person having to - see `lib/overlayStoryNotice.tsx`.
   */
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ScreenFrame height={520}>
        <NotAuthenticatedScreen />
      </ScreenFrame>
    ),
  parameters: {
    // The component takes no props; it reads the user through the decorator-seeded context.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'NotAuthenticatedScreen is the screen for someone who is signed in and still not ' +
            'allowed in. Not a login prompt: the authentication worked, the authorization did ' +
            'not.',
          '',
          '|        |                                                                      |',
          '| ------ | -------------------------------------------------------------------- |',
          '| Source | `packages/sanity/src/core/studio/screens/NotAuthenticatedScreen.tsx` |',
          '| Tier   | SERVICE                                                              |',
          '',
          'It is the only screen in this family rendered as a `Dialog` rather than a card, with ' +
            'a single "Sign out" action.',
          '',
          '> **Why it matters:** the second paragraph is the design, and it exists because of a ' +
            'specific, common, invisible mistake. Someone with two accounts - a personal Google ' +
            'login and a work SSO one - lands here and reasonably concludes they have not been ' +
            'invited to the project. In fact they have; they are simply signed in as the wrong ' +
            'person. So the screen names who you currently are, in bold, with the email and the ' +
            'identity provider you used, and only then offers to sign you out. It converts "you ' +
            'cannot come in" into "check which key you are holding", which is the actual problem ' +
            'far more often than the permissions are.',
          '',
          'Note the ordering of the two paragraphs: what happened first, how to check it ' +
            'second. And the one action is Sign out rather than "Request access" - because the ' +
            'likely fix is to come back as someone else, not to escalate.',
          '',
          '**A thing to notice about the first render.** `currentUser` starts as `null` and is ' +
            'filled in when the auth observable emits, so for one frame the sentence reads ' +
            '"signed in as ( )" with an empty name, empty email and no provider. With a ' +
            'synchronous store this goes unnoticed; over a slow auth request it shows. There is ' +
            'no skeleton or guard on that paragraph.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'pattern:error-messages',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof NotAuthenticatedScreen>

export const Default: Story = {
  name: 'Signed in, not authorized',
  decorators: [withUser(googleUser), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The ordinary case: a real user, authenticated through Google, without access to this project. `getProviderTitle` turns the provider id into "Google" so the sentence ends "…through Google." rather than naming an internal identifier.',
      },
    },
  },
}

export const SsoUser: Story = {
  name: 'Signed in through SSO',
  decorators: [withUser(samlUser), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'An enterprise SAML provider. `getProviderTitle` has no friendly name for it, so the provider clause is omitted entirely and the sentence simply ends after the email. That is the right degradation - better a shorter true sentence than one ending in a raw provider slug.',
      },
    },
  },
}

export const BeforeUserResolves: Story = {
  name: 'Before the user has resolved',
  decorators: [withUser(null), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The first-frame state, held still. The auth observable has emitted no user, so the paragraph that exists to tell you which account you are using renders as "signed in as ( )" - name blank, email blank, provider clause gone.\n\nIt is a real state rather than a hypothetical: it is what a slow or failing auth request leaves on screen. And it is the worst possible moment for it, because this is precisely the screen whose whole purpose is answering "which account am I?". No skeleton, no fallback text, no guard on the render.',
      },
    },
  },
}
