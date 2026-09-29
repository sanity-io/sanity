import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseValidationBadgeStory} from './ReleaseValidationBadgeStory'

/**
 * Chromatic sentinel: release properties validation status (empty / valid
 * / errors / validating) after the `@sanity/ui` Card tone colouring.
 * Locale-fixture labels only; no live documents.
 */
const meta = {
  title: 'Releases/Validation Badge',
  component: ReleaseValidationBadgeStory,
} satisfies Meta<typeof ReleaseValidationBadgeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
