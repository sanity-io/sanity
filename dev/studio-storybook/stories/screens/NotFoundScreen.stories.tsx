import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NotFoundScreen} from '../../../../packages/sanity/src/core/studio/screens/NotFoundScreen'
import {ScreenFrame} from '../../lib/screenFrame'

const meta: Meta<typeof NotFoundScreen> = {
  title: 'Navbar & Shell/Screens/Workspace Not Found',
  component: NotFoundScreen,
  args: {onNavigateToDefaultWorkspace: () => undefined},
  // Every screen in this family is a `height="fill"` card. Without a sized stage it collapses
  // to its content and the vertical centring - most of the design - never happens.
  render: (args) => (
    <ScreenFrame>
      <NotFoundScreen {...args} />
    </ScreenFrame>
  ),
  parameters: {
    // Only prop is the navigate-away callback; nothing here is a value worth controlling.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'NotFoundScreen is what the studio renders when the URL names a workspace that does ' +
            'not exist: a caution-toned full screen with one heading and one way out.',
          '',
          '|        |                                                              |',
          '| ------ | ------------------------------------------------------------ |',
          '| Source | `packages/sanity/src/core/studio/screens/NotFoundScreen.tsx` |',
          '| Tier   | CHROME                                                       |',
          '',
          'This is the studio equivalent of a 404, and it is one of a family of full-screen ' +
            'states nobody sees during normal work and everybody eventually hits: a stale ' +
            'bookmark, a workspace renamed in config, a link from a colleague on a different ' +
            'branch of the studio.',
          '',
          '> **Why it matters:** the screen is deliberately bare, and the one decision in it is ' +
            'that the escape hatch is a button rather than a link. A "go to default workspace" ' +
            'button calls back into the running studio and routes there directly; a plain anchor ' +
            'link would reload the whole application. From an error state that is a meaningful ' +
            'difference: a client-side route preserves whatever the studio still has in memory, ' +
            'and a reload throws it away to prove a point about a URL.',
          '',
          'The family reads as a set: this one, Tool Not Found, No Tools, Redirecting, Import ' +
            'Error and the CORS screens are what an editor meets when something upstream of the ' +
            'interface has gone wrong, and they are the least-designed and least-reviewed ' +
            'surfaces in the studio precisely because they are rare.',
          '',
          '**Note the i18n status.** Every string on this screen is a hard-coded English ' +
            'literal, with an `oxlint-disable i18next/no-literal-string` at the top of the file ' +
            'to silence the linter that would otherwise say so. That is true of most of this ' +
            'family - see the chapter docs for the full picture.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:shell',
    'pattern:error-messages',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof NotFoundScreen>

export const Default: Story = {
  name: 'Workspace not found',
  parameters: {
    docs: {
      description: {
        story:
          'The whole screen, on a bounded stage. In a real studio it fills the viewport, because there is nothing else on the page: the shell never mounted, since the workspace it would have mounted for does not exist.',
      },
    },
  },
}
