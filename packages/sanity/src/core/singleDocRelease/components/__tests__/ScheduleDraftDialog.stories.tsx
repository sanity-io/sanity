import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ScheduleDraftDialogStory} from './ScheduleDraftDialogStory'

/**
 * `@sanity/ui` sentinel for the schedule-draft dialog with a fixed date in
 * the past: the datetime input, the past-date warning card and the disabled
 * confirm button.
 */
const meta = {
  title: 'Single Doc Release/Schedule Draft Dialog',
  component: ScheduleDraftDialogStory,
} satisfies Meta<typeof ScheduleDraftDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace; wait for the dialog to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Schedule draft for publishing')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('Select when this document should be published.')).toBeVisible()
    await expect(body.getByText('Schedule for a future time and date.')).toBeVisible()
    await expect(body.getByRole('button', {name: 'Schedule'})).toBeDisabled()
  },
}
