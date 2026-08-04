import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UserMenu} from '../../../../packages/sanity/src/core/studio/components/navbar/userMenu/UserMenu'
import {NavbarProviders, NavbarStoryFrame} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

const meta: Meta = {
  title: 'Navbar & Shell/User Menu',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    layout: 'fullscreen',
    // No props; the component reads its user from context.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'UserMenu is the signed-in identity control at the right of the navbar: it shows the ' +
            "current user's avatar and opens the personal menu, profile, the appearance and " +
            'locale preferences, and sign out.',
          '',
          '|         |                                                                                                                                                           |',
          '| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source  | `packages/sanity/src/core/studio/components/navbar/userMenu/UserMenu.tsx`                                                                                 |',
          '| Tier    | CHROME                                                                                                                                                    |',
          '| Harness | reads the current user from the workspace source, which the studio harness seeds with a mock user, so it renders a real signed-in avatar and menu offline |',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:identity', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Default: Story = {
  name: 'The user menu',
  render: () => (
    <NavbarProviders>
      <NavbarStoryFrame align="end">
        <UserMenu />
      </NavbarStoryFrame>
    </NavbarProviders>
  ),
}
