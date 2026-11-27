import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {DocumentTypeFilterItemStory} from './DocumentTypeFilterItemStory'

/**
 * Chromatic sentinel: global-search document-type filter row. Unselected
 * default bleed vs selected primary + checkmark. Fixture titles only.
 */
const meta = {
  title: 'Studio/Document Type Filter Item',
  component: DocumentTypeFilterItemStory,
} satisfies Meta<typeof DocumentTypeFilterItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for a filter row so
  // Chromatic does not archive the Suspense fallback.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('Author')).toBeVisible(), {timeout: 5000})
  },
}
