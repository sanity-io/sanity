import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {TasksActivityItemStory} from './TasksActivityItemStory'

/**
 * Chromatic sentinel: task activity row layout (avatar slot + children)
 * after the ui5 Flex/Box migration. Play waits for the resolved Doug
 * avatar so the snapshot is not the loading skeleton.
 */
const meta = {
  title: 'Tasks/Activity Item',
  component: TasksActivityItemStory,
} satisfies Meta<typeof TasksActivityItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // UserAvatar is a div with aria-label, not role=img.
    const avatars = await canvas.findAllByLabelText('Doug')
    await expect(avatars).toHaveLength(2)
  },
}
