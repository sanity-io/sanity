import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CopyToDraftsMenuItemStory} from './CopyToDraftsMenuItemStory'

/**
 * Chromatic sentinel: Box padding around the drafts avatar in the
 * copy-to-drafts menu row. The menu stays closed besides this single item.
 */
const meta = {
  title: 'Releases/Copy To Drafts Menu Item',
  component: CopyToDraftsMenuItemStory,
} satisfies Meta<typeof CopyToDraftsMenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // CopyToDraftsMenuItem returns null when drafts are disabled or the source
  // perspective is drafts/published. Assert the row rendered so a config
  // default drifting can't turn this into an auto-accepted blank baseline.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByTestId('copy-to-drafts-menu-item')).toBeVisible(), {
      timeout: 3000,
    })
  },
}
