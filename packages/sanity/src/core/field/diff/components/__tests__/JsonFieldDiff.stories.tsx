import {type Meta, type StoryObj} from '@storybook/react-vite'

import {JsonFieldDiffStory} from './JsonFieldDiffStory'

/**
 * Chromatic sentinel: review-changes unknown-schema JSON diffs (changed /
 * added / removed) after the ui5 Flex migration. Fixture JSON, no
 * annotations.
 */
const meta = {
  title: 'Field/JSON Field Diff',
  component: JsonFieldDiffStory,
} satisfies Meta<typeof JsonFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
