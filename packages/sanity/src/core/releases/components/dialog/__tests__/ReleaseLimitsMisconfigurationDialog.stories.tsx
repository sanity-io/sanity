import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReleaseLimitsMisconfigurationDialogStory} from './ReleaseLimitsMisconfigurationDialogStory'

/**
 * Chromatic sentinel: releases misconfiguration dialog (Dialog + VStack)
 * after the ui5 migration. Studio i18n copy; no live limits.
 */
const meta = {
  title: 'Releases/Limits Misconfiguration Dialog',
  component: ReleaseLimitsMisconfigurationDialogStory,
} satisfies Meta<typeof ReleaseLimitsMisconfigurationDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit, so wait for the dialog before touching focus.
  // @sanity/ui Dialog then deterministically focuses its first focusable
  // descendant; blur it so the snapshot is about layout, not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
