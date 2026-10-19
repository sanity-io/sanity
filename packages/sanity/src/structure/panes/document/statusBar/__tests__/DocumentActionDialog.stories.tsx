import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {DocumentActionDialogStory} from './DocumentActionDialogStory'

/**
 * Chromatic sentinel: document-action modal after the ui5 Box migration.
 * ModalDialog pads the content and footer slots with Box.
 */
const meta = {
  title: 'Structure/Document Action Dialog',
  component: DocumentActionDialogStory,
} satisfies Meta<typeof DocumentActionDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Publish: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit, so wait for the dialog before touching focus.
  // Sanity UI Dialog then deterministically focuses its first focusable
  // descendant; blur it so the snapshot is about layout, not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
