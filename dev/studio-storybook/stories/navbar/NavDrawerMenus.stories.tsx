import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AppearanceMenu} from '../../../../packages/sanity/src/core/studio/components/navbar/navDrawer/ApperanceMenu'
import {NavbarProviders} from '../../lib/navbarHarness'
import {WithStudioProviders} from '../../lib/testProvider'

const studioConfig = {name: 'default', title: 'Acme Content', schema: {name: 'default', types: []}}

const meta: Meta = {
  title: 'Navbar & Shell/Nav Drawer Menus',
  decorators: [WithStudioProviders({config: studioConfig})],
  parameters: {
    // setScheme is a callback, not a value; nothing here is meaningfully controllable.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The appearance (color scheme) menu is a small, always-there preference control that ' +
            'lives inside the navbar drawer, owned by the shell rather than any document. It ' +
            'reads the current scheme from context and offers System, Light, and Dark, with a ' +
            'checkmark on the active choice.',
          '',
          '|        |                                          |',
          '| ------ | ---------------------------------------- |',
          '| Source | `.../navbar/navDrawer/ApperanceMenu.tsx` |',
          '| Tier   | CHROME                                   |',
          '',
          'Its sibling, the locale menu (`LocaleMenu.tsx`), belongs here too but needs a studio ' +
            'configured with multiple locales to show anything; that is a harness follow-up (see ' +
            'the navbar decomposition map).',
        ].join('\n'),
      },
    },
  },
  tags: ['chapter:navbar', 'pattern:preferences', 'source:studio', 'tier:chrome'],
}

export default meta
type Story = StoryObj

export const Appearance: Story = {
  name: 'Appearance menu (color scheme)',
  render: () => (
    <NavbarProviders>
      <Card radius={3} shadow={1} overflow="hidden" style={{width: 240}}>
        <AppearanceMenu setScheme={() => undefined} />
      </Card>
    </NavbarProviders>
  ),
}
