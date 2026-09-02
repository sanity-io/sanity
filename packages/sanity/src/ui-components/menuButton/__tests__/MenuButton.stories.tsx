import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {Button} from '../../button/Button'
import {MenuItem} from '../../menuItem/MenuItem'
import {MenuButton} from '../MenuButton'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` MenuButton,
 * which enforces popover animation. The caller composes the trigger and the
 * `Menu`; the wrapper takes care of the popover wiring (open/close, focus,
 * dismissal) following the WAI-ARIA menu button pattern. `Menu` and
 * `MenuDivider` are used raw from `@sanity/ui` (no studio wrapper exists).
 * The `play` function opens the menu so the snapshot captures the portaled
 * popover, not just the trigger.
 */
const meta = {
  title: 'UI Components/Menu Button',
  component: MenuButton,
  decorators: [
    (Story) => (
      <Flex align="flex-start" justify="center" paddingTop={4} style={{minHeight: 320}}>
        <Story />
      </Flex>
    ),
  ],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof MenuButton>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    id: 'document-actions-menu',
    button: <Button iconRight={ChevronDownIcon} mode="ghost" text="Document actions" />,
    menu: (
      <Menu>
        <MenuItem icon={EditIcon} text="Edit" />
        <MenuItem hotkeys={['Ctrl', 'Alt', 'P']} icon={PublishIcon} text="Publish" />
        <MenuItem icon={CopyIcon} text="Duplicate" />
        <MenuDivider />
        <MenuItem icon={TrashIcon} text="Delete" tone="critical" />
      </Menu>
    ),
    popover: {portal: true},
  },
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', {name: 'Document actions'}))
    // The menu portals to document.body
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'Delete'})).toBeVisible(), {
      timeout: 3000,
    })
  },
}
