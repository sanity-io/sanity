import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, within} from 'storybook/test'

import {CommentsListItemContextMenuStory} from './CommentsListItemContextMenuStory'

/**
 * Chromatic sentinel: comments-v2 list-item floating action card after the
 * ui5 Flex migration. Fixture copy only; overflow id is unique per canvas.
 */
const meta = {
  title: 'Comments (v2)/List Item Context Menu',
  component: CommentsListItemContextMenuStory,
} satisfies Meta<typeof CommentsListItemContextMenuStory>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Closed cards: parent open (with overflow), resolved, reply, read-only,
 * upsell. Only the first row mounts `id="comment-actions-menu"`.
 */
export const States: Story = {
  args: {mode: 'states'},
}

/**
 * One overflow instance. Play opens the menu so Chromatic captures Edit /
 * Delete / Copy link, not just the trigger.
 */
export const Open: Story = {
  args: {mode: 'open'},
  parameters: {chromatic: {delay: 300}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the locale bundle; wait for the trigger.
    const trigger = await canvas.findByRole(
      'button',
      {name: 'Open comment actions menu'},
      {timeout: 5000},
    )
    await userEvent.click(trigger)
    const body = within(document.body)
    const edit = await body.findByRole('menuitem', {name: 'Edit comment'}, {timeout: 3000})
    await expect(edit).toBeVisible()
    await expect(await body.findByRole('menuitem', {name: 'Delete comment'})).toBeVisible()
    await expect(await body.findByRole('menuitem', {name: 'Copy link to comment'})).toBeVisible()
  },
}
