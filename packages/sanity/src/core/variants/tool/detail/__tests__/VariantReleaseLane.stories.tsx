import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VariantReleaseLaneStory} from './VariantReleaseLaneStory'

/**
 * Chromatic sentinel: variant-detail release-lane tabs after the ui5 Flex
 * migration. All / published (positive) / drafts / named release (primary) /
 * untitled fallback. Fixture segments only; no live releases store.
 */
const meta = {
  title: 'Variants/Release Lane',
  component: VariantReleaseLaneStory,
} satisfies Meta<typeof VariantReleaseLaneStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
