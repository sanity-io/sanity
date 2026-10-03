import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ConfirmDiscardDialogStory} from './ConfirmDiscardDialogStory'

/**
 * Chromatic sentinel: structure discard-changes confirm dialog (published
 * vs draft-only copy). Fixture locale strings only.
 */
const meta = {
  title: 'Structure/Confirm Discard Dialog',
  component: ConfirmDiscardDialogStory,
} satisfies Meta<typeof ConfirmDiscardDialogStory>

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

export const Published: Story = {
  args: {mode: 'published'},
  play: waitAndBlurDialog,
}

export const Draft: Story = {
  args: {mode: 'draft'},
  play: waitAndBlurDialog,
}
