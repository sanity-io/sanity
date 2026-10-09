import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {UnlinkFromCanvasDialogStory} from './UnlinkFromCanvasDialogStory'

/**
 * Chromatic sentinel: the unlink-from-Canvas confirm dialog in its idle,
 * loading and error states. Fixture copy only; the error card's fade-in is
 * covered by the capture delay.
 */
const meta = {
  title: 'Canvas/Unlink From Canvas Dialog',
  component: UnlinkFromCanvasDialogStory,
  parameters: {
    chromatic: {delay: 400},
  },
} satisfies Meta<typeof UnlinkFromCanvasDialogStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace and Storybook resolves render
// on the first commit, so wait for the dialog before touching focus.
// @sanity/ui Dialog then deterministically focuses its first focusable
// descendant; blur it so the snapshot is about layout, not a focus ring.
async function waitForDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5000})
}

async function waitAndBlurDialog() {
  await waitForDialog()
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const Idle: Story = {
  args: {status: 'idle'},
  play: waitAndBlurDialog,
}

// While unlinking, the close button is gone and both footer buttons are
// disabled, so nothing takes focus and there is nothing to blur.
export const Loading: Story = {
  args: {status: 'loading'},
  play: waitForDialog,
}

export const UnlinkError: Story = {
  args: {status: 'error'},
  play: waitAndBlurDialog,
}
