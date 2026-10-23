import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReviewChangesHighlightStory} from './ReviewChangesHighlightStory'

/**
 * Chromatic sentinel: Portable Text review-changes overlay. Default vs
 * fullscreen left inset. Fixture copy only.
 */
const meta = {
  title: 'Portable Text/Review Changes Highlight',
  component: ReviewChangesHighlightStory,
} satisfies Meta<typeof ReviewChangesHighlightStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
