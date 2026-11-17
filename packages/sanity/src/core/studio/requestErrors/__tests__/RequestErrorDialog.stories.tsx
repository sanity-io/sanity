import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {RequestErrorDialogStory} from './RequestErrorDialogStory'

/**
 * Chromatic sentinel: request-error dialog after the ui5 Flex/Box migration.
 * Retryable network chrome; no countdown.
 */
const meta = {
  title: 'Studio/Request Error Dialog',
  component: RequestErrorDialogStory,
} satisfies Meta<typeof RequestErrorDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const NetworkRetryable: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit, so wait for the dialog before touching focus.
  // @sanity/ui Dialog then deterministically focuses its first focusable
  // descendant (the status.sanity.io link); blur it so the snapshot is about
  // layout, not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
