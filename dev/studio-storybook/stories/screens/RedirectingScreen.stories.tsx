import {type Meta, type StoryObj} from '@storybook/react-vite'

import {RedirectingScreen} from '../../../../packages/sanity/src/core/studio/screens/RedirectingScreen'
import {ScreenFrame} from '../../lib/screenFrame'

const meta: Meta<typeof RedirectingScreen> = {
  title: 'Navbar & Shell/Screens/Redirecting',
  component: RedirectingScreen,
  render: (args) => (
    <ScreenFrame height={360}>
      <RedirectingScreen {...args} />
    </ScreenFrame>
  ),
  parameters: {
    // `reason` is a free-text message decided by the caller, not something to browse via a
    // controls panel; each story fixes its own.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This is the screen shown for the moment between deciding to send you somewhere and ' +
            'getting you there.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/screens/RedirectingScreen.tsx` |',
          '| Tier | CHROME |',
          '',
          'A primary-toned card, a double-chevron, and a line of text. Its whole job is to ' +
            'occupy a gap.',
          '',
          '> **Why it matters:** it is toned primary, not caution like its neighbours in this ' +
            'family, and that is the design. Every other full-screen state in this family means ' +
            'something went wrong; this one means something is going right and is not finished ' +
            'yet. If it were caution-toned an editor would read a normal redirect as a fault, ' +
            'which is how "the studio flashed an error at me" reports get filed against a working ' +
            'system.',
          '',
          'It is also the only screen here that takes a message from its caller rather than ' +
            'owning its own copy, because the reason for a redirect is knowledge the redirecting ' +
            'code has and the screen does not.',
        ].join('\n'),
      },
    },
  },
  tags: ['autodocs', 'chapter:shell', 'source:studio-only', 'tier:chrome'],
}

export default meta
type Story = StoryObj<typeof RedirectingScreen>

export const Default: Story = {
  name: 'Default message',
  parameters: {
    docs: {
      description: {
        story:
          'With no `reason` passed, it falls back to "Redirecting…" - true, uninformative, and the right default. A caller with nothing specific to say should not be forced to invent something.',
      },
    },
  },
}

export const WithReason: Story = {
  name: 'With a stated reason',
  args: {reason: 'Redirecting to the default workspace…'},
  parameters: {
    docs: {
      description: {
        story:
          'The form real callers use. The value of naming the destination is not reassurance during the redirect - it is far too brief for that - it is that if the redirect stalls, the frozen screen says where it was trying to go.',
      },
    },
  },
}

export const LongReason: Story = {
  name: 'A long reason',
  args: {
    reason:
      'Redirecting to the workspace configured for your organization, because the requested one is not available on this deployment…',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The text is rendered as a heading in a `Container width={0}` with no truncation, so ' +
          'it wraps and the card grows. That is the correct behaviour for a message whose ' +
          'length the component cannot control. The same string in a fixed-height chip would be ' +
          'cut off with no tooltip.',
      },
    },
  },
}
