import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {TimeZoneButtonStory} from './TimeZoneButtonStory'

/**
 * Reuses the in-package harness: the time zone trigger (switchable button vs
 * locked inline label) after the ui5 Text / Icon migration. The dialog stays
 * closed; zone copy is the Tokyo fixture.
 */
const meta = {
  title: 'Studio/Time Zone Button',
  component: TimeZoneButtonStory,
  parameters: {
    chromatic: {delay: 300},
  },
} satisfies Meta<typeof TimeZoneButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the zone
    // labels are not in the canvas on the first frame.
    const labels = await canvas.findAllByText(
      'Japan Standard Time (Asia/Tokyo)',
      {},
      {timeout: 5000},
    )
    await expect(labels.length).toBeGreaterThanOrEqual(2)
  },
}
