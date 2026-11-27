import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantsOverviewColumnDefsStory} from './VariantsOverviewColumnDefsStory'

/**
 * Chromatic sentinel: variants overview table cells after the ui5 Text
 * migration. Title, empty conditions, truncation, type, and document
 * counts. Fixture rows only; animated loading skeletons omitted.
 */
const meta = {
  title: 'Variants/Overview Columns',
  component: VariantsOverviewColumnDefsStory,
} satisfies Meta<typeof VariantsOverviewColumnDefsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Cells: Story = {}
