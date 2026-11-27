import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DatetimeFieldDiffStory} from './DatetimeFieldDiffStory'

/**
 * Chromatic sentinel: DiffFromTo grid layout on review-changes date diffs
 * (changed / added / removed). Date-only values only — datetime with a time
 * formats in the local timezone and would churn across environments.
 */
const meta = {
  title: 'Field/Datetime Diff',
  component: DatetimeFieldDiffStory,
} satisfies Meta<typeof DatetimeFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
