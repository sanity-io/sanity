import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {RequestErrorDialogStory} from './RequestErrorDialogStory'

/**
 * Chromatic sentinel: request-error dialog after the ui5 Flex/Box migration.
 * Retryable network chrome; no countdown.
 */
const meta = {
  title: 'Studio/Request Error Dialog',
  component: RequestErrorDialogStory,
} satisfies Meta<typeof RequestErrorDialogStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace and Storybook resolves render
// on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant (the status.sanity.io link); blur it so the snapshot is about
// layout, not a focus ring.
async function settleDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const NetworkRetryable: Story = {
  play: settleDialog,
}

/** A listener that failed for good: "Connection error", status link, reload-only footer. */
export const ListenerError: Story = {
  args: {variant: 'listener'},
  play: async () => {
    await settleDialog()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByText('Connection error')).toBeVisible()
    await expect(within(dialog).queryByRole('button', {name: 'Try again'})).toBeNull()
  },
}
