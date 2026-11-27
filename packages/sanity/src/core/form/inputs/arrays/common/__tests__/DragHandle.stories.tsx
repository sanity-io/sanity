import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DragHandleStory} from './DragHandleStory'

/**
 * Chromatic sentinel: array drag handle in list, grid, and read-only
 * states. Tooltip stays closed.
 */
const meta = {
  title: 'Inputs/Array Drag Handle',
  component: DragHandleStory,
} satisfies Meta<typeof DragHandleStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
