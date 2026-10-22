import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {StudioAnnouncementsDialogStory} from './StudioAnnouncementsDialogStory'

/**
 * Chromatic sentinel for the "What's new" announcements dialog with two
 * fixture announcements, their divider and the floating close button.
 */
const meta = {
  title: 'Studio/Announcements Dialog',
  component: StudioAnnouncementsDialogStory,
} satisfies Meta<typeof StudioAnnouncementsDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace; wait for the dialog to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(
      () => expect(body.getByText('Content Releases are now generally available')).toBeVisible(),
      {timeout: 5000},
    )
    await expect(body.getByText('A faster document pane')).toBeVisible()
    await expect(body.getByText('Sep 10')).toBeVisible()
    await expect(body.getByLabelText('Close dialog')).toBeVisible()
  },
}
