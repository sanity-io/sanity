import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CommentsDialogsStory} from './CommentsDialogsStory'

/**
 * Chromatic sentinel: post-migration ui5 comments-v2 delete and discard
 * dialogs. Critical confirm plus optional error line. Fixture copy only.
 */
const meta = {
  title: 'Comments (v2)/Dialogs',
  component: CommentsDialogsStory,
} satisfies Meta<typeof CommentsDialogsStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace and Storybook resolves render
// on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant; blur it so the snapshot is about layout, not a focus ring.
async function waitAndBlurDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const DeleteComment: Story = {
  args: {mode: 'delete-comment'},
  play: waitAndBlurDialog,
}

export const DeleteThread: Story = {
  args: {mode: 'delete-thread'},
  play: waitAndBlurDialog,
}

export const DeleteError: Story = {
  args: {mode: 'delete-error'},
  play: waitAndBlurDialog,
}

export const Discard: Story = {
  args: {mode: 'discard'},
  play: waitAndBlurDialog,
}
