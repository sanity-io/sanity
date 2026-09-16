import {type Meta, type StoryObj} from '@storybook/react-vite'

import {AgentBundleMenuItemStory} from './AgentBundleMenuItemStory'

/**
 * Reuses the in-package harness: Box padding and badge-suggest icon color on
 * the agent-bundle perspective menu item. The item is unselected.
 */
const meta = {
  title: 'Perspective/Agent Bundle Menu Item',
  component: AgentBundleMenuItemStory,
} satisfies Meta<typeof AgentBundleMenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
