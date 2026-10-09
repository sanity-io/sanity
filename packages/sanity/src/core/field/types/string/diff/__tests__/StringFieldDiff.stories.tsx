import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StringFieldDiffStory} from './StringFieldDiffStory'

/**
 * Reuses the in-package harness: review-changes string DiffString segments
 * and the enum-list FromTo branch. Fixture copy, no live timestamps.
 */
const meta = {
  title: 'Field/String Field Diff',
  component: StringFieldDiffStory,
} satisfies Meta<typeof StringFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
