import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {DeleteVariantDialogStory} from './DeleteVariantDialogStory'

/**
 * Chromatic sentinel: delete-variant confirm dialog. Critical confirm plus
 * muted body copy. Fixture title only.
 */
const meta = {
  title: 'Variants/Delete Dialog',
  component: DeleteVariantDialogStory,
} satisfies Meta<typeof DeleteVariantDialogStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the async locale import and Storybook resolves
// render on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant; blur it so the snapshot is about layout, not a focus ring.
async function waitAndBlurDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const Idle: Story = {
  args: {mode: 'idle'},
  play: waitAndBlurDialog,
}

export const Deleting: Story = {
  args: {mode: 'deleting'},
  // Confirm/cancel are disabled while deleting, so Dialog does not move
  // focus off document.body — only wait for the portal to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  },
}
