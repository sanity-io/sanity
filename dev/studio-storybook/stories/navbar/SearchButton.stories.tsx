import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {SearchPopover} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/SearchPopover'
import {SearchButton} from '../../../../packages/sanity/src/core/studio/components/navbar/search/SearchButton'
import {NavbarProviders, NavbarStoryFrame} from '../../lib/navbarHarness'
import {SearchHarness, WithSearchProviders} from '../../lib/searchHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

const meta: Meta = {
  title: 'Navbar & Shell/Search Button',
  parameters: {
    layout: 'fullscreen',
    // The component's entire props interface is `{onClick}`; nothing else to control.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The navbar trigger that opens global search is deliberately just a button: its ' +
            'entire props interface is a single click handler. It holds no search state, ' +
            'announces the affordance and its keyboard shortcut, and hands off.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/SearchButton.tsx` |',
          '| Tier | CHROME. It is the doorway to search, not the search itself |',
          '',
          '> **Why it matters:** the trigger and the machinery are cleanly separable, and this ' +
            'page shows both sides. On its own the button is a button, which is the honest thing ' +
            'to show. Wired up, it opens the real subsystem. Looking only at the first story ' +
            'leads to concluding the component does nothing, which is right about the component ' +
            'and wrong about the seam.',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:global-search', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'The search trigger',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    docs: {
      description: {
        story:
          'The button by itself, with nothing behind it. Hover it for the tooltip and its hotkey. This is the whole component: everything else about search lives elsewhere.',
      },
    },
  },
  render: () => (
    <NavbarProviders>
      {/* The frame defaults to 460px so navbar menus have room to drop open. Nothing
          opens in this story, so that reserve renders as half a screen of empty dark
          and the button reads as a failed render. Height it to the trigger instead. */}
      <NavbarStoryFrame align="end" minHeight={96}>
        <SearchButton onClick={() => undefined} />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}

export const InContext: Story = {
  name: 'In context: opening real search',
  decorators: [WithSearchProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'The trigger wired to the subsystem it exists for. Click it and the real `SearchPopover` opens against the fixture Content Lake: type a query and the results are genuinely searched. This is the story that shows what the button is for, and it is the composition `StudioNavbar` itself performs.',
      },
    },
  },
  render: function InContextSearchButton() {
    const [open, setOpen] = useState(false)
    return (
      <SearchHarness>
        <NavbarStoryFrame align="end">
          <SearchButton onClick={() => setOpen(true)} />
        </NavbarStoryFrame>
        <SearchPopover
          open={open}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          disableFocusLock
          disableIntentLink
        />
      </SearchHarness>
    )
  },
}
