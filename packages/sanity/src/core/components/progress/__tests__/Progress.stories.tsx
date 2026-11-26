import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ProgressStory} from './ProgressStory'

/**
 * Reuses the in-package harness: linear and circular determinate progress
 * at 0 / 25 / 50 / 75 / 100 so a theme-hue or stroke-width drift fails
 * Chromatic.
 */
const meta = {
  title: 'Studio/Progress',
  component: ProgressStory,
} satisfies Meta<typeof ProgressStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
