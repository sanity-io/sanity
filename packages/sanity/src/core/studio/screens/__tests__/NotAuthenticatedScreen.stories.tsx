import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {NotAuthenticatedScreenStory} from './NotAuthenticatedScreenStory'

/**
 * Chromatic sentinel: "Not authorized" boot dialog after the ui5 VStack
 * migration. Fixture identity, mock auth store, no network.
 */
const meta = {
  title: 'Studio/Not Authenticated Screen',
  component: NotAuthenticatedScreenStory,
} satisfies Meta<typeof NotAuthenticatedScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const SignedInWithoutAccess: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit, so wait for the dialog before touching focus.
  // react-rx subscribes to the auth state on commit too, so the first paint
  // still renders the `null` initial value: wait for the fixture identity and
  // the provider copy as well, or the capture can catch the anonymous render.
  // @sanity/ui Dialog then deterministically focuses its first focusable
  // descendant; blur it so the snapshot is about layout, not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(body.getByText('Ada Lovelace (ada@example.com)')).toBeVisible())
    await expect(body.getByText(/through Google/)).toBeVisible()
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
