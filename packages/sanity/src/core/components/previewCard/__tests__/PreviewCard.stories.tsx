import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PreviewCardStory} from './PreviewCardStory'

/**
 * Reuses the in-package harness: idle vs selected PreviewCard and the
 * selected-state TextWithTone color override.
 */
const meta = {
  title: 'Studio/Preview Card',
  component: PreviewCardStory,
} satisfies Meta<typeof PreviewCardStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
