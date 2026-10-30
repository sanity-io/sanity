import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ImagePreviewStory} from './ImagePreviewStory'

/**
 * Chromatic sentinel: empty-image placeholder in review-changes image
 * diffs (`NoImagePreview`). No live asset URLs.
 */
const meta = {
  title: 'Field/Image Preview',
  component: ImagePreviewStory,
} satisfies Meta<typeof ImagePreviewStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
