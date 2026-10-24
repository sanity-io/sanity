import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ScheduledPublishingDateInputsStory} from './ScheduledPublishingDateInputsStory'

/**
 * `@sanity/ui` and styled-components sentinel for the scheduled-publishing
 * date inputs and tool calendar: the base calendar with and without time
 * selection, bare and tool calendar days with pips, the closed datetime
 * inputs, the edit-schedule form, the dialog header and date element queries,
 * the permissions-aware context menu item and the empty schedules panel.
 * Every value is pinned to January 2024 and the schedules are fixtures.
 */
const meta = {
  title: 'Scheduled Publishing/Date Inputs and Tool Calendar',
  component: ScheduledPublishingDateInputsStory,
} satisfies Meta<typeof ScheduledPublishingDateInputsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('Schedule publishing')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('Schedules')).toBeVisible()
    // The constants row and the closed tool-calendar tooltip both carry the state titles.
    await expect(body.getAllByText('Upcoming').length).toBeGreaterThan(0)
    await expect(body.getByPlaceholderText('Pick a date')).toBeVisible()
    await expect(body.getByPlaceholderText('Common date input')).toBeVisible()
    await expect(body.getByText('Publish date')).toBeVisible()
    await expect(body.getByText('Date and time')).toBeVisible()
    await expect(body.getByText('Delete schedule')).toBeVisible()
    await expect(body.getByText('No completed scheduled publications ... yet')).toBeVisible()
  },
}
