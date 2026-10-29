import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantDocumentTableColumnDefsStory} from './VariantDocumentTableColumnDefsStory'

/**
 * Reuses the in-package harness: every visible column of the variant document table rendered
 * for a valid, a validating and an invalid row. Tooltips stay closed (no animated overlay).
 */
const meta = {
  title: 'Variants/Document Table Columns',
  component: VariantDocumentTableColumnDefsStory,
} satisfies Meta<typeof VariantDocumentTableColumnDefsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
