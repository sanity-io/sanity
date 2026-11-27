import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FreeTrialDialogContentStory} from './FreeTrialDialogContentStory'

/**
 * Chromatic sentinel: free-trial modal heading, description, close control,
 * and footer after the ui5 Heading migration. Fixture copy; no image.
 */
const meta = {
  title: 'Studio/Free Trial Dialog',
  component: FreeTrialDialogContentStory,
  args: {mode: 'primary'},
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof FreeTrialDialogContentStory>

export default meta
type Story = StoryObj<typeof meta>

// TestWrapper suspends on the mock workspace and Storybook resolves render
// on the first commit, so wait for the dialog before touching focus.
// The Dialog then deterministically focuses a descendant; blur it so the
// snapshot is about layout, not a focus ring.
async function waitAndBlurDialog() {
  const body = within(document.body)
  await waitFor(() => expect(body.getByRole('dialog')).toBeVisible(), {timeout: 5_000})
  await waitFor(() => expect(document.activeElement).not.toBe(document.body))
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export const PrimaryOnly: Story = {
  args: {mode: 'primary'},
  play: waitAndBlurDialog,
}

export const WithSecondary: Story = {
  args: {mode: 'secondary'},
  play: waitAndBlurDialog,
}
