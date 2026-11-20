import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {OAuthLoginComponentStory, OAuthLoginErrorsStory} from './OAuthLoginComponentStory'

/**
 * Reuses the in-package harness: the OAuth sign-in screen, before and after the user starts
 * signing in, plus the critical error Cards for a refused authorization.
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

export const Errors: Story = {
  render: () => <OAuthLoginErrorsStory />,
  play: async () => {
    const body = within(document.body)
    // Three Cards: invalid_target, access_denied with a description, generic code-only.
    await waitFor(
      async () => {
        await expect(body.getAllByTestId('oauth-login-error')).toHaveLength(3)
      },
      {timeout: 5000},
    )
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
