import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FreeTrialButtonStory} from './FreeTrialButtonStory'

/**
 * Reuses the in-package harness: free-trial topbar ring and sidebar
 * labels after the vanilla-extract stroke overlay.
 */
const meta = {
  title: 'Studio/Free Trial Button',
  component: FreeTrialButtonStory,
} satisfies Meta<typeof FreeTrialButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
