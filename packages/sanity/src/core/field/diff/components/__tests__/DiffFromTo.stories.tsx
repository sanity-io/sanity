import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DiffFromToStory} from './DiffFromToStory'

/**
 * Chromatic sentinel: review-changes DiffFromTo from/to cards (unchanged /
 * added / removed / changed) in inline and grid layouts. Tooltips stay
 * closed.
 */
const meta = {
  title: 'Field/Diff From To',
  component: DiffFromToStory,
} satisfies Meta<typeof DiffFromToStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
