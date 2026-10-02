import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'
import {expect, waitFor, within} from 'storybook/test'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {RequestPermissionDialog} from '../RequestPermissionDialog'

/**
 * Chromatic sentinel for the "ask to edit" dialog: description over the note
 * input and its right-aligned character counter inside the ui5 Box body, with
 * the cancel/confirm footer. The roles lookup resolves to `null` through the
 * mock client and falls back to the administrator role, so no request state
 * reaches the snapshot.
 */
const meta = {
  title: 'Structure/Request Permission Dialog',
  component: RequestPermissionDialog,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof RequestPermissionDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {onClose: noop, onRequestSubmitted: noop},
  // TestWrapper suspends on the mock workspace, so wait for the dialog. The
  // dialog then focuses the note input; blur it so the archive is about
  // layout rather than a focus ring.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(document.activeElement).not.toBe(document.body))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
