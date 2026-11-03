import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {
  BlockObjectActionsMenuOpenStory,
  BlockObjectActionsMenuStory,
} from './BlockObjectActionsMenuStory'

/**
 * Reuses the in-package harness: the Portable Text object-block action row
 * (default / read-only / reference) after the ui5 Flex / Box migration. The
 * Open story is a single menu so the snapshot is the portaled items.
 */
const meta = {
  title: 'Portable Text/Block Object Actions Menu',
  component: BlockObjectActionsMenuStory,
} satisfies Meta<typeof BlockObjectActionsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}

/**
 * One trigger so the snapshot is the open Edit / Remove menu, not a grid of
 * closed ellipsis buttons. Play waits for TestWrapper before clicking.
 */
export const Open: Story = {
  render: BlockObjectActionsMenuOpenStory,
  play: async () => {
    const body = within(document.body)
    await userEvent.click(await body.findByRole('button', {name: 'Open menu'}, {timeout: 5000}))
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'Remove'})).toBeVisible(), {
      timeout: 3000,
    })
  },
}
