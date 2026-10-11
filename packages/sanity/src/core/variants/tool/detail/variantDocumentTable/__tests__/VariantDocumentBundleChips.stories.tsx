import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantDocumentBundleChipsStory} from './VariantDocumentBundleChipsStory'

/**
 * Reuses the in-package harness: published / drafts / release badge tones
 * plus overflow +N. Tooltip stays closed (no animated overlay).
 */
const meta = {
  title: 'Variants/Bundle Chips',
  component: VariantDocumentBundleChipsStory,
} satisfies Meta<typeof VariantDocumentBundleChipsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
