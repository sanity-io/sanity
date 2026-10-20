import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PaneMenuButtonItemStory} from './PaneMenuButtonItemStory'

/**
 * Chromatic sentinel: pane action-menu expanded group titles (ui5 Box
 * padding around the Label) plus selected / critical / disabled rows.
 * Fixture titles only; collapsed submenu stays closed.
 */
const meta = {
  title: 'Structure/Pane Menu Button Item',
  component: PaneMenuButtonItemStory,
} satisfies Meta<typeof PaneMenuButtonItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
