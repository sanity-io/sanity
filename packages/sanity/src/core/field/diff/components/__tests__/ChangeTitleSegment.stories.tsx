import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ChangeTitleSegmentStory} from './ChangeTitleSegmentStory'

/**
 * Reuses the in-package harness: Box padding on review-changes array index
 * segments (unchanged / added / removed / moved). Tooltips stay closed.
 */
const meta = {
  title: 'Field/Change Title Segment',
  component: ChangeTitleSegmentStory,
} satisfies Meta<typeof ChangeTitleSegmentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
