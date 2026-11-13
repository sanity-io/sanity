import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {AgentBundleMenuItemStory} from './AgentBundleMenuItemStory'

/**
 * Reuses the in-package harness: Box padding and badge-suggest icon color on
 * the agent-bundle perspective menu item, plus the selected row whose title
 * follows the card foreground so a Sanity UI theme swap cannot wash it out.
 */
const meta = {
  title: 'Perspective/Agent Bundle Menu Item',
  component: AgentBundleMenuItemStory,
} satisfies Meta<typeof AgentBundleMenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for both rows so
  // Chromatic does not archive the Suspense fallback.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const labels = await canvas.findAllByText('Proposed changes', {}, {timeout: 5000})
    await expect(labels).toHaveLength(2)
  },
}
