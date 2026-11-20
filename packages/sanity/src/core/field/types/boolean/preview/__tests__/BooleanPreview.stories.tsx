import {type Meta, type StoryObj} from '@storybook/react-vite'

import {BooleanPreviewStory} from './BooleanPreviewStory'

/**
 * Chromatic sentinel: review-changes boolean checkbox and switch SVGs with
 * a fixture user color (checked / unchecked / undefined).
 */
const meta = {
  title: 'Field/Boolean Preview',
  component: BooleanPreviewStory,
} satisfies Meta<typeof BooleanPreviewStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
