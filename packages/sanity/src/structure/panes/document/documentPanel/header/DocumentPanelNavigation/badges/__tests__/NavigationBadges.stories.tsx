import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {NavigationBadgesStory} from './NavigationBadgesStory'

/**
 * Reuses the in-package harness: document-panel navigation chips for draft,
 * published and agent perspectives. Tooltips stay closed.
 */
const meta = {
  title: 'Structure/Document Panel Navigation/Navigation Badges',
  component: NavigationBadgesStory,
} satisfies Meta<typeof NavigationBadgesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the chips
    // are not in the canvas on the first frame.
    await canvas.findByTestId('navigation-badges-draft', undefined, {timeout: 5000})
  },
}
