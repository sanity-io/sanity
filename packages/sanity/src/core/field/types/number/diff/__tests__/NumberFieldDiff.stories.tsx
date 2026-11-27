import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NumberFieldDiffStory} from './NumberFieldDiffStory'

/**
 * Chromatic sentinel: Box spacing on review-changes number diffs (changed,
 * added, removed). Tooltips stay closed.
 */
const meta = {
  title: 'Field/Number Diff',
  component: NumberFieldDiffStory,
} satisfies Meta<typeof NumberFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
