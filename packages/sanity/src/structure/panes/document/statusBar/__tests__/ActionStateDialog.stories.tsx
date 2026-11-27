import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {ActionStateDialogStory} from './ActionStateDialogStory'

/**
 * Chromatic sentinel: document-action confirm popovers after the ui5
 * ConfirmPopover migration. Fallback Cancel/OK versus a custom critical
 * confirm row.
 */
const meta = {
  title: 'Structure/Action State Dialog',
  component: ActionStateDialogStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ActionStateDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Confirm: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends on the mock workspace; wait for the triggers
    // so the popovers have a reference element to dock to.
    await canvas.findByRole('button', {name: 'Publish'})
    const body = within(document.body)
    const fallback = await body.findByText('Publish this document?')
    await expect(fallback).toBeVisible()
    const critical = await body.findByRole('button', {name: 'Delete now'})
    await expect(critical).toBeVisible()
  },
}
