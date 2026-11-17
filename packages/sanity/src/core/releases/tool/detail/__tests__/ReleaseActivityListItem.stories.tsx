import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReleaseActivityListItemStory} from './ReleaseActivityListItemStory'

/**
 * Chromatic sentinel: one release activity row per release-level event type
 * — create / edit with a schedule target, schedule, unschedule, publish,
 * archive and unarchive — with fixed fixture timestamps.
 */
const meta = {
  title: 'Releases/Release Activity List Item',
  component: ReleaseActivityListItemStory,
} satisfies Meta<typeof ReleaseActivityListItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const Events: Story = {
  // TestWrapper suspends on the mock workspace and the row fades in; wait for
  // the last row's copy so Chromatic archives the settled list. The row's text node also holds
  // the " · " before the timestamp, hence the substring match.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByText(/Unarchived the/)).toBeVisible(), {timeout: 5000})
  },
}
