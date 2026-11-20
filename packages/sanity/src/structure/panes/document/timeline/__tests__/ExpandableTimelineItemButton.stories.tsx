import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {ExpandableTimelineItemButtonStory} from './ExpandableTimelineItemButtonStory'

/**
 * Reuses the in-package harness: collapsed vs expanded chevron on the
 * timeline expand control. The expanded icon is already `data-expanded`, so
 * Chromatic delay waits out the 200ms transform rather than playing a click.
 */
const meta = {
  title: 'Structure/Expandable Timeline Item Button',
  component: ExpandableTimelineItemButtonStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ExpandableTimelineItemButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByText('expanded', {}, {timeout: 5000})
  },
}
