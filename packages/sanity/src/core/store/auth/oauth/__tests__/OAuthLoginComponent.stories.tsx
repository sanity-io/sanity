import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {OAuthLoginComponentStory} from './OAuthLoginComponentStory'

/**
 * Reuses the in-package harness: the OAuth sign-in screen, before and after the user starts
 * signing in.
 */
const meta = {
  title: 'Auth/OAuth Login',
  component: OAuthLoginComponentStory,
} satisfies Meta<typeof OAuthLoginComponentStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace, so wait for the button first.
async function findSignInButton() {
  const body = within(document.body)
  return waitFor(() => body.getByRole('button', {name: 'Sign in with Sanity'}), {timeout: 5000})
}

export const Idle: Story = {
  play: async () => {
    const button = await findSignInButton()
    // The button takes focus on mount; blur it so the snapshot is about layout, not a focus ring.
    button.blur()
  },
}

export const Redirecting: Story = {
  play: async () => {
    const button = await findSignInButton()
    await userEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    button.blur()
  },
}
