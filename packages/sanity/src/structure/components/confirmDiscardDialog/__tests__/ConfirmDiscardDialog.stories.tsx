import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ConfirmDiscardDialogStory} from './ConfirmDiscardDialogStory'

/**
 * Chromatic sentinel for the discard-changes confirmation dialog ahead of its
 * `ui5` migration: the narrow dialog with its header, the confirmation copy
 * and the single confirm button in the footer.
 */
const meta = {
  title: 'Structure/Confirm Discard Dialog',
  component: ConfirmDiscardDialogStory,
} satisfies Meta<typeof ConfirmDiscardDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Discard changes?')).toBeVisible(), {timeout: 5000})
    await expect(
      body.getByText('Are you sure you want to discard all changes since last published?'),
    ).toBeVisible()
    await expect(body.getByRole('button', {name: 'Discard changes'})).toBeVisible()
  },
}
