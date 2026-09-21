import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TasksVisualStory} from './TasksVisualStory'

/**
 * Tasks shell, sidebar, list, and form styling across the desktop, overlay, and fullscreen
 * breakpoints affected by the vanilla-extract migration.
 */
const meta = {
  title: 'Tasks/Task Views',
  component: TasksVisualStory,
  parameters: {
    chromatic: {
      modes: {
        desktop: {viewport: {height: 1400, width: 1280}},
        overlay: {viewport: {height: 1400, width: 900}},
        fullscreen: {viewport: {height: 1400, width: 560}},
      },
    },
  },
} satisfies Meta<typeof TasksVisualStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
