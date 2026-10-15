import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ImageFieldDiffStory} from './ImageFieldDiffStory'

/**
 * Chromatic sentinel: review-changes image diff empty states after the ui5
 * Box / Flex migration. No live image assets. Copy is locale-fixture only.
 */
const meta = {
  title: 'Field/Image Diff',
  component: ImageFieldDiffStory,
} satisfies Meta<typeof ImageFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
