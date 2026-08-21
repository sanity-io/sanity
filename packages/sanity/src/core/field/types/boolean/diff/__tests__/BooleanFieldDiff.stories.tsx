import {type Meta, type StoryObj} from '@storybook/react-vite'

import {BooleanFieldDiffStory} from './BooleanFieldDiffStory'

/**
 * Reuses the in-package harness: Box spacing on review-changes boolean diffs
 * (switch / checkbox, changed / added). Tooltips stay closed.
 */
const meta = {
  title: 'Field/Boolean Diff',
  component: BooleanFieldDiffStory,
} satisfies Meta<typeof BooleanFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
