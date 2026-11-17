import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {VersionContextMenuItemStory} from './VersionContextMenuItemStory'

/**
 * Chromatic sentinel: the copy-to-release menu row for every release
 * timing (asap, undecided, scheduled with and without a date, locked once
 * scheduled) plus the untitled fallback. The menu stays closed besides each
 * single row.
 */
const meta = {
  title: 'Releases/Version Context Menu Item',
  component: VersionContextMenuItemStory,
} satisfies Meta<typeof VersionContextMenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the rows so
  // Chromatic does not archive the Suspense fallback.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText('scheduled Release')).toBeVisible(), {
      timeout: 5000,
    })
  },
}
