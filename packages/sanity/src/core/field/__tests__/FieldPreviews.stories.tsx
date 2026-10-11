import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FieldPreviewsStory} from './FieldPreviewsStory'

/**
 * Reuses the in-package harness: ui5 Box padding on string / number / slug
 * review-changes previews. Values are static (no timestamps).
 */
const meta = {
  title: 'Field/Previews',
  component: FieldPreviewsStory,
} satisfies Meta<typeof FieldPreviewsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
