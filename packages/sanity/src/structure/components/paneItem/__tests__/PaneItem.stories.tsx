import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PaneItemStory} from './PaneItemStory'

/**
 * Chromatic sentinel: list-pane count badge states. Fixture counts only.
 */
const meta = {
  title: 'Structure/Pane Item Count',
  component: PaneItemStory,
} satisfies Meta<typeof PaneItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
