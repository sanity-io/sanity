import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {SCHEDULE_FAILED_TEXT} from '../../../constants'
import {StateReasonFailedInfoStory} from './StateReasonFailedInfoStory'

/**
 * Reuses the in-package harness: the failed-schedule icon button and its
 * open menu after the ui5 Text / Flex / Icon migration. Copy is a fixture.
 */
const meta = {
  title: 'Scheduled Publishing/State Reason Failed Info',
  component: StateReasonFailedInfoStory,
} satisfies Meta<typeof StateReasonFailedInfoStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}

/**
 * One trigger so the snapshot is the open menu, not a grid of closed
 * buttons. Query the icon button by test id — it has no accessible name
 * until the tooltip opens.
 */
export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await userEvent.click(
      await body.findByTestId('schedule-validation-list-button', {}, {timeout: 5000}),
    )
    await waitFor(() => expect(body.getByText(SCHEDULE_FAILED_TEXT)).toBeVisible(), {
      timeout: 3000,
    })
  },
}
