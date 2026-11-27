import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {ScheduledValidationStory} from './ScheduledValidationStory'

/**
 * Chromatic sentinel: scheduled-publishing validation list items, icon
 * buttons, and the failed-schedule reason menu after the ui5
 * Container/Flex migration. Fixture markers only; no live dataset.
 */
const meta = {
  title: 'Scheduled Publishing/Validation',
  component: ScheduledValidationStory,
} satisfies Meta<typeof ScheduledValidationStory>

export default meta
type Story = StoryObj<typeof meta>

export const List: Story = {
  args: {mode: 'list'},
}

export const Buttons: Story = {
  args: {mode: 'buttons'},
}

// TestWrapper suspends on the mock workspace; wait for the bleed button
// before opening. Blur after the menu is visible so the snapshot is the
// failed-reason layout, not a focus ring.
export const Failed: Story = {
  args: {mode: 'failed'},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByTestId('schedule-validation-list-button', undefined, {
      timeout: 5_000,
    })
    await userEvent.click(button)
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('This schedule failed to run.')).toBeVisible(), {
      timeout: 3_000,
    })
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
