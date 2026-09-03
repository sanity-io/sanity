import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {RequestPermissionDialogStory} from './RequestPermissionDialogStory'

/**
 * Chromatic sentinel: the "ask to edit" dialog ahead of the ui5 Flex
 * migration. Description, note input with counter, cancel/confirm footer.
 */
const meta = {
  title: 'Structure/Request Permission Dialog',
  component: RequestPermissionDialogStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof RequestPermissionDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // TestWrapper suspends on the mock workspace and Storybook resolves render
  // on the first commit, so wait for the dialog before touching focus.
  // @sanity/ui Dialog then deterministically focuses its first focusable
  // descendant (the note input); blur it so the snapshot is about layout,
  // not a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
