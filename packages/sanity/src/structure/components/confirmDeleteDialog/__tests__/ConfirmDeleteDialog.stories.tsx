import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {ConfirmDeleteDialogStory} from './ConfirmDeleteDialogStory'

/**
 * Chromatic sentinel: the confirm-delete dialog and its referring-documents
 * body ahead of the ui5 Flex migration. Fixture references only.
 */
const meta = {
  title: 'Structure/Confirm Delete Dialog',
  component: ConfirmDeleteDialogStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof ConfirmDeleteDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Dialog: Story = {
  args: {mode: 'dialog'},
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

export const ReferringDocuments: Story = {
  args: {mode: 'referring-documents'},
  // The cross-dataset references render inside a collapsed <details>; open
  // it so the project/dataset/document-id table is part of the snapshot.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const details = await canvas.findByTestId('cross-dataset-references', {}, {timeout: 5000})
    const summary = details.querySelector('summary')
    if (summary) await userEvent.click(summary)
    await waitFor(() => expect(details).toHaveAttribute('open'))
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
