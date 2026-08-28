import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantsEmptyStateStory} from './VariantsEmptyStateStory'

/**
 * Reuses the in-package harness: variants empty state after the ui5 Flex
 * migration. Inline SVG illustration; no live variant data.
 */
const meta = {
  title: 'Variants/Empty State',
  component: VariantsEmptyStateStory,
} satisfies Meta<typeof VariantsEmptyStateStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
