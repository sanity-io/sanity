import {Card, Flex} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {HomeButton} from '../../../../packages/sanity/src/core/studio/components/navbar/home/HomeButton'
import {NavbarProviders} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

// Minimal workspace: HomeButton renders the active workspace's icon (or its title initial when
// no icon is set). A title gives the preview mark something to draw.
const studioConfig = {
  name: 'default',
  title: 'Acme Content',
  schema: {
    name: 'default',
    types: [
      {
        name: 'article',
        title: 'Article',
        type: 'document',
        fields: [{name: 'title', title: 'Title', type: 'string'}],
      },
    ],
  },
}

const meta: Meta = {
  title: 'Navbar & Shell/Home Button',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    // HomeButton takes no props (it reads the active workspace from context), so a controls
    // panel would advertise nothing. Declared absent rather than left silent.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The leftmost control in the Studio navbar is a quiet anchor: it shows the active ' +
            "workspace's icon, or its title initial, and links back to the workspace root. It " +
            'is the one persistent "you are here, take me home" affordance in the shell.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/home/HomeButton.tsx` |',
          '| Tier | CHROME. It frames and navigates the editing surface; it is not the editing |',
          '| Harness | reads `useActiveWorkspace()`, which `WithStudioProviders` omits, so this story wraps it in `NavbarProviders` (`lib/navbarHarness.tsx`) to seed the active workspace and color scheme |',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:workspace-switching', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'The home button',
  render: () => (
    <NavbarProviders>
      <HomeButton />
    </NavbarProviders>
  ),
}

/**
 * In the navbar's leading cluster, where it sits flush against the workspace menu. The mark is
 * the workspace's, so in a multi-workspace studio the home button also reads as "which studio".
 */
export const InContext: Story = {
  name: 'In context, the leading cluster',
  render: () => (
    <NavbarProviders>
      <Card padding={2} radius={3} shadow={1} style={{width: 'fit-content'}}>
        <Flex align="center" gap={1}>
          <HomeButton />
        </Flex>
      </Card>
    </NavbarProviders>
  ),
}
