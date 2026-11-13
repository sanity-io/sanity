import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {RequestPermissionDialogStory} from './RequestPermissionDialogStory'

/**
 * Chromatic sentinel for the request-permission dialog ahead of its `ui5`
 * migration: the dialog header, the note input with its character counter
 * and the cancel / send footer.
 */
const meta = {
  title: 'Structure/Request Permission Dialog',
  component: RequestPermissionDialogStory,
} satisfies Meta<typeof RequestPermissionDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Ask for edit access')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('0/150')).toBeVisible()
    await expect(body.getByRole('button', {name: 'Send request'})).toBeVisible()
  },
}
