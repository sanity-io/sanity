import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantsOverviewColumnDefsStory} from './VariantsOverviewColumnDefsStory'

/**
 * Row cells of the variant definitions overview table: linked title card
 * with conditions text and the documents-count cell, including the
 * "No conditions" and "-" fallbacks.
 */
const meta = {
  title: 'Variants/Overview Row Cells',
  component: VariantsOverviewColumnDefsStory,
} satisfies Meta<typeof VariantsOverviewColumnDefsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
