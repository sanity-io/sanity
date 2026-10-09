import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ConfirmScheduledDraftsDialogStory} from './ConfirmScheduledDraftsDialogStory'

/**
 * Chromatic sentinel: confirm-active-scheduled-drafts dialog after the ui5
 * VStack migration. Fixture dates only (2099 vs 2020); no live schedules.
 */
const meta = {
  title: 'Releases/Confirm Scheduled Drafts Dialog',
  component: ConfirmScheduledDraftsDialogStory,
} satisfies Meta<typeof ConfirmScheduledDraftsDialogStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the async releases locale import and Storybook
// resolves render on the first commit, so wait for the dialog before
// touching focus. @sanity/ui Dialog then deterministically focuses its
// first focusable descendant; blur it so the snapshot is about layout,
// not a focus ring.
async function waitAndBlurDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const FutureDates: Story = {
  args: {mode: 'future'},
  play: waitAndBlurDialog,
}

export const PastDates: Story = {
  args: {mode: 'past'},
  play: waitAndBlurDialog,
}
