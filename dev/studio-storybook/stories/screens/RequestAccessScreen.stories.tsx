import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {RequestAccessScreen} from '../../../../packages/sanity/src/core/studio/screens/RequestAccessScreen'
import {
  type AccessApiStubOptions,
  accessRequest,
  activeWorkspaceValue,
  createAccessApiClient,
  daysAgo,
  lockedOutUser,
} from '../../lib/accessApiStub'
import {OverlayStoryNotice} from '../../lib/overlayStoryNotice'
import {ScreenFrame} from '../../lib/screenFrame'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * Seeds the context value with a client wired to the fabricated Access API. Each story differs
 * only in what that API answers, which is the whole point: every branch of this screen is
 * decided by one HTTP response nobody can produce locally.
 */
function withAccessApi(options: AccessApiStubOptions): Decorator {
  const value = activeWorkspaceValue(lockedOutUser, createAccessApiClient(options))
  return (Story) => (
    // oxlint-disable-next-line no-unsafe-type-assertion -- only `auth` is read by this screen
    <ActiveWorkspaceMatcherContext.Provider value={value as never}>
      <Story />
    </ActiveWorkspaceMatcherContext.Provider>
  )
}

const meta: Meta<typeof RequestAccessScreen> = {
  title: 'Navbar & Shell/Screens/Request Access',
  component: RequestAccessScreen,
  /**
   * Docs-mode guard, same as its sibling `NotAuthenticatedScreen`: this screen is a `Dialog`,
   * which portals a full-viewport overlay and mounts a focus lock. The docs-health gate runs at
   * `--max-overlays 0`, and six of these on one page would bury the prose and fight over the
   * active element. Ledger #50.
   */
  render: (_args, {viewMode, id, name}) =>
    viewMode === 'docs' ? (
      <OverlayStoryNotice title={name} storyId={id} />
    ) : (
      <ScreenFrame height={560}>
        <RequestAccessScreen />
      </ScreenFrame>
    ),
  parameters: {
    // The component itself takes no props; every story is driven by a decorator-seeded stub.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'RequestAccessScreen is the screen for someone who authenticated successfully, holds ' +
            'no roles on this project, and can ask for some: six distinct presentations, all ' +
            'decided by a single HTTP response.',
          '',
          '|              |                                                                                                                                                         |',
          '| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source       | `packages/sanity/src/core/studio/screens/RequestAccessScreen.tsx`                                                                                       |',
          '| Tier         | SERVICE                                                                                                                                                 |',
          '| Real source  | the Sanity Access API: `GET /access/requests/me` and `POST /access/project/:projectId/requests`. No other part of the studio calls either               |',
          '| Stubbed with | `lib/accessApiStub.ts`, a client whose only behaviour is those two endpoints, with request ages computed as offsets from render time                    |',
          '| Mounted by   | `packages/sanity/src/core/studio/AuthBoundary.tsx:137`, when `loggedIn === "unauthorized"` and `loginProvider` is set to anything other than `sanity`   |',
          '| Cannot show  | whether the real endpoints return these shapes, the 409 already-denied submit path, the toast on a non-429 non-409 failure, or the real note round-trip |',
          '',
          '> **Why it is stubbed rather than storied normally.** Reaching this screen for real ' +
            'means being signed in as a user with zero roles on the project you are opening, ' +
            'through a third-party identity provider. That is a property of the account, resolved ' +
            'server-side; no config, fixture or dataset produces it. Seeing all six states would ' +
            'mean maintaining a second Sanity account deliberately locked out of a project, and ' +
            'then getting the backend into four different request histories. The component is ' +
            'real and shipped. The endpoint under it is invented here.',
          '',
          '**The precondition is narrower than it looks.** `AuthBoundary` sends a user here ' +
            'only when `currentUser.provider` is set and is not `sanity`. A `sanity`-provider ' +
            'user with the same empty `roles` array gets `NotAuthenticatedScreen` instead, a ' +
            'screen with no request affordance at all. So the same account state produces two ' +
            'different products depending on which button you originally signed in with.',
          '',
          '**Every timestamp here is relative.** The screen sorts requests by age against a ' +
            'two-week window (`isAfter(addWeeks(createdAt, 2), new Date())`). A fixture with a ' +
            'literal date would render as pending the day it was written and silently become ' +
            'expired a fortnight later, same story, same name, different screen. ' +
            '`lib/accessApiStub.ts` exposes `daysAgo()` and nothing else, so that mistake is not ' +
            'available.',
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
    'variant:stubbed',
  ],
}

export default meta
type Story = StoryObj<typeof RequestAccessScreen>

export const Default: Story = {
  name: 'No prior request',
  decorators: [withAccessApi({requests: []}), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story: [
          'The ordinary first arrival. `GET /access/requests/me` returns nothing for this ' +
            'project, so the screen offers the note field and an enabled Request access button.',
          '',
          'The note is capped at 150 characters with a live counter, and Enter submits from ' +
            'the field. Read the first paragraph beside `NotAuthenticatedScreen`: both name who ' +
            'you are signed in as, in bold, with the provider, because the most common cause of ' +
            'landing here is being signed in as the wrong one of your two accounts.',
        ].join('\n'),
      },
    },
  },
}

export const PendingRequest: Story = {
  name: 'Request pending',
  decorators: [
    withAccessApi({requests: [accessRequest({status: 'pending', createdAt: daysAgo(3)})]}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A request submitted three days ago and not yet answered. The note field is replaced entirely by a transparent card, and the button becomes a disabled "Request sent".\n\nNote the tone: `transparent`, not `caution`. Pending is the only one of the three card states that is not a problem, and it is the only one that does not warn.',
      },
    },
  },
}

export const ExpiredRequest: Story = {
  name: 'Previous request expired',
  decorators: [
    withAccessApi({requests: [accessRequest({status: 'pending', createdAt: daysAgo(21)})]}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The same `status: "pending"` record as the story above, three weeks old instead of three days. Server-side nothing changed; the screen reclassifies it purely on age and re-opens the form with a different first sentence.\n\nThis is the state most likely to be mislabelled by a fixture, and the reason `lib/accessApiStub.ts` refuses literal dates: written as a constant, "Request pending" becomes this screen after fourteen days without anything failing.',
      },
    },
  },
}

export const Denied: Story = {
  name: 'Request declined',
  decorators: [
    withAccessApi({requests: [accessRequest({status: 'declined', createdAt: daysAgo(3)})]}),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'A declined request, still inside its two-week cooling-off window. The card turns `caution` and the Request access button is removed rather than disabled, so the only remaining action is Sign out.\n\nThe decline also expires: past two weeks the same record stops matching and the form comes back. Nothing on screen says so, which means a person told "declined" has no way to learn that asking again will be possible, or when.',
      },
    },
  },
}

export const RateLimited: Story = {
  name: 'Over the cross-project limit',
  decorators: [
    withAccessApi({
      requests: [],
      submitError: {
        statusCode: 429,
        message:
          "You've reached the limit for access requests across all projects. Please wait before submitting more requests or contact an admin for assistance.",
      },
    }),
    WithStudioProviders(),
  ],
  parameters: {
    docs: {
      description: {
        story: [
          'Opens in the same state as "No prior request": the limit is a property of the ' +
            "account across every project, so nothing in this project's history predicts it. " +
            'Submitting is what reveals it.',
          '',
          'Press Request access to see the 429 branch: the form is replaced by a caution card ' +
            "carrying the server's own message, and the button is removed. This is the one " +
            'state on this page reachable only by acting, so `qa/interactions.mjs` drives it ' +
            'rather than leaving it to the render gate.',
        ].join('\n'),
      },
    },
  },
}

export const AccessApiUnreachable: Story = {
  name: 'Access API unreachable',
  decorators: [withAccessApi({failing: true}), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story: [
          'When the GET errors, the screen does not render an error state. It renders a ' +
            '**different screen**: `NotAuthenticatedScreen`, the one with no request affordance ' +
            'at all.',
          '',
          'That is a deliberate fallback and a defensible one, since a request form backed by ' +
            'an unreachable endpoint is worse than no form. The catch is that the two screens ' +
            'are indistinguishable from the outside: someone who could have asked for access is ' +
            'shown the version that says only "sign out", and nothing indicates that a retry ' +
            'might behave differently.',
        ].join('\n'),
      },
    },
  },
}

export const WhileLoading: Story = {
  name: 'While the request history loads',
  decorators: [withAccessApi({pending: true}), WithStudioProviders()],
  parameters: {
    docs: {
      description: {
        story:
          "The GET held open, so the screen stays on its loading branch: a bare `LoadingBlock`, no dialog, no chrome.\n\nUnlike the first-frame gap in `NotAuthenticatedScreen`, this one is guarded: `loading` starts `true` and only clears in the observable's `finalize`, so there is no frame where a half-filled dialog is visible. The two sibling screens made opposite choices about the same problem.",
      },
    },
  },
}
