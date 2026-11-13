import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FieldPreviewsStory} from './FieldPreviewsStory'

/**
 * Reuses the in-package harness: ui5 Box padding on string / number / slug
 * and date-only review-changes previews. Values are static (no timestamps,
 * no local-timezone datetime).
 */
const meta = {
  title: 'Field/Previews',
  component: FieldPreviewsStory,
} satisfies Meta<typeof FieldPreviewsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
