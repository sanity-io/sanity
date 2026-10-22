import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {UserAvatarStory} from './UserAvatarStory'

/**
 * Chromatic sentinel for UserAvatar initials, size, status, and the studio
 * tooltip wrapper used on the document status line. Play hovers the
 * `withTooltip` avatar so the snapshot is the open tooltip, not just the
 * initials. No image URL — a hanging `src` stalls Chromatic.
 */
const meta = {
  title: 'Studio/User Avatar',
  component: UserAvatarStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof UserAvatarStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('img', {name: 'Ada Lovelace'})).toBeVisible(), {
      timeout: 5000,
    })
    await userEvent.hover(body.getByRole('img', {name: 'Ada Lovelace'}))
    // The tooltip portals to document.body after the shared 400ms open delay
    await waitFor(() => expect(body.getByText('Ada Lovelace')).toBeVisible(), {
      timeout: 3000,
    })
  },
}
