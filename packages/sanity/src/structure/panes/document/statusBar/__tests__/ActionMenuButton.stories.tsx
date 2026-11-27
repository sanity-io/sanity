import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ActionMenuButtonStory} from './ActionMenuButtonStory'

/**
 * Chromatic sentinel: document-footer overflow menu after the ui5 MenuItem
 * migration. Closed ContextMenuButton, disabled trigger, and expanded rows
 * (shortcut, caution, disabled). The portaled MenuButton flyout is already
 * snapshotted by UI Components/Menu Button; an Open play on this trigger
 * did not reliably keep the menu mounted in Storybook.
 */
const meta = {
  title: 'Structure/Action Menu Button',
  component: ActionMenuButtonStory,
} satisfies Meta<typeof ActionMenuButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
