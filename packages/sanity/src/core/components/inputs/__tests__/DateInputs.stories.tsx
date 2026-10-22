import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {DateInputsStory} from './DateInputsStory'

/**
 * `@sanity/ui` sentinel for the date input family: the full calendar with
 * and without time selection, bare months and days, the year / time / lazy
 * text primitives, the closed datetime input in its states and the search
 * filter calendar. Every value is pinned to January 2024.
 */
const meta = {
  title: 'Studio/Date Inputs',
  component: DateInputsStory,
} satisfies Meta<typeof DateInputsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByPlaceholderText('Pick a date')).toBeVisible(), {
      timeout: 5000,
    })
    // The editable and the `disableInput` datetime inputs both show this value.
    await expect(body.getAllByDisplayValue('2024-01-15 10:00')).toHaveLength(2)
    await expect(body.getAllByText('January').length).toBeGreaterThan(0)
  },
}
