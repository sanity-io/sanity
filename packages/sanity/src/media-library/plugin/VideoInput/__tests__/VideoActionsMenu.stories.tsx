import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {VideoActionsMenuOpenStory, VideoActionsMenuStory} from './VideoActionsMenuStory'

/**
 * Chromatic sentinel: muted video field RatioBox plus the absolute options
 * overlay after the ui5 Box migration. Closed landscape first; Open forces
 * the menu so the overlay chrome is snapshotted.
 */
const meta = {
  title: 'Media Library/Video Actions Menu',
  component: VideoActionsMenuStory,
} satisfies Meta<typeof VideoActionsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  render: () => <VideoActionsMenuOpenStory />,
  play: async () => {
    const body = within(document.body)
    const replace = await body.findByRole('menuitem', {name: 'Replace'})
    await expect(replace).toBeVisible()
  },
}
