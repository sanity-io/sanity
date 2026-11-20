import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SlugFieldDiffStory} from './SlugFieldDiffStory'

/**
 * Chromatic sentinel: Box spacing on review-changes slug diffs (changed,
 * added). Tooltips stay closed.
 */
const meta = {
  title: 'Field/Slug Diff',
  component: SlugFieldDiffStory,
} satisfies Meta<typeof SlugFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
