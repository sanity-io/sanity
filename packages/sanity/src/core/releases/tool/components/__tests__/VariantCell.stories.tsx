import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantCellStory} from './VariantCellStory'

/**
 * Reuses the in-package harness: the variant diamond and title in the
 * releases table after the ui5 Icon / Text migration. Tooltips stay closed.
 */
const meta = {
  title: 'Releases/Variant Cell',
  component: VariantCellStory,
} satisfies Meta<typeof VariantCellStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
