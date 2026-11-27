import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CopyToDraftsDialogStory} from './CopyToDraftsDialogStory'

/**
 * Chromatic sentinel: copy-to-drafts override dialog. Confirm plus body
 * copy. Locale-fixture only.
 */
const meta = {
  title: 'Releases/Copy To Drafts Dialog',
  component: CopyToDraftsDialogStory,
} satisfies Meta<typeof CopyToDraftsDialogStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the async locale import and Storybook resolves
// render on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant; blur it so the snapshot is about layout, not a focus ring.
export const OverrideDraft: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
