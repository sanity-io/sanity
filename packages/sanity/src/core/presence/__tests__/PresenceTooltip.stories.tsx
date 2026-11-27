import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {PresenceTooltipStory} from './PresenceTooltipStory'

/**
 * The tooltip listing who is present at a field. `play` hovers the trigger so
 * the open tooltip (avatar and name rows) is what gets snapshotted.
 */
const meta = {
  title: 'Presence/Presence Tooltip',
  component: PresenceTooltipStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof PresenceTooltipStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends while the mock workspace resolves, so wait for the trigger.
    await userEvent.hover(
      await canvas.findByTestId('presence-tooltip-trigger', {}, {timeout: 5000}),
    )
    await waitFor(() => expect(canvas.getByText('Grace Hopper')).toBeVisible(), {timeout: 3000})
  },
}
