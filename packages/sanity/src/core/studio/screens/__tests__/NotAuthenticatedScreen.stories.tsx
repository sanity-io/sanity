import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {NotAuthenticatedScreenStory} from './NotAuthenticatedScreenStory'

/**
 * Chromatic sentinel for the "Not authorized" dialog: heading, the two
 * explanatory paragraphs with the bold "signed in as" account and provider
 * suffix, and the "Sign out" footer button. The user and provider are
 * fixtures (no auth request).
 */
const meta = {
  title: 'Studio/Not Authenticated Screen',
  component: NotAuthenticatedScreenStory,
} satisfies Meta<typeof NotAuthenticatedScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // TestWrapper suspends on the mock workspace and react-rx subscribes to the
  // auth state on commit, so the first paint is the anonymous render. Wait for
  // the fixture identity and provider copy, then blur the Dialog's auto-focused
  // element so the snapshot is about layout, not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(body.getByText('Ada Lovelace (ada@example.com)')).toBeVisible())
    await expect(body.getByText(/through Google/)).toBeVisible()
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
