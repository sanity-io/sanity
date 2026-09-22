import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {StudioAnnouncementsCardStory} from './StudioAnnouncementsCardStory'

/**
 * Chromatic sentinel: floating "What's new" announcement card after the ui5
 * VStack/Box migration. Open popover in the bottom-left corner; fixture copy.
 */
const meta = {
  title: 'Studio/Announcements Card',
  component: StudioAnnouncementsCardStory,
} satisfies Meta<typeof StudioAnnouncementsCardStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit; wait for the portaled card so addon-vitest asserts
  // the popover actually opened.
  play: async () => {
    const body = within(document.body)
    await waitFor(
      () => expect(body.getByRole('button', {name: 'Open announcements'})).toBeVisible(),
      {timeout: 5000},
    )
  },
}
