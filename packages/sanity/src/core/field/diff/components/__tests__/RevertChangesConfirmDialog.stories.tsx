import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {RevertChangesConfirmDialogStory} from './RevertChangesConfirmDialogStory'

/**
 * Chromatic sentinel: review-changes revert confirmation after the ui5
 * ConfirmPopover migration. One-change versus many-change critical copy.
 */
const meta = {
  title: 'Field/Revert Changes Confirm',
  component: RevertChangesConfirmDialogStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof RevertChangesConfirmDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Confirm: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the mock workspace; wait for the triggers
    // so the popovers have a reference element to dock to.
    await canvas.findByRole('button', {name: 'Revert change'})
    const body = within(document.body)
    // Assert on the popover copy, not the trigger labels (they share names).
    const one = await body.findByText('Are you sure you want to revert the change?')
    await expect(one).toBeVisible()
    const all = await body.findByText('Are you sure you want to revert all 4 changes?')
    await expect(all).toBeVisible()
  },
}
