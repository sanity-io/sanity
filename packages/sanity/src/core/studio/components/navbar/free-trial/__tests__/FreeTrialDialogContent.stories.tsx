import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FreeTrialDialogContentStory} from './FreeTrialDialogContentStory'

/**
 * Chromatic sentinel for the free-trial modal (`DialogContent`) ahead of its
 * styled-components migration: the absolutely positioned close button over
 * the dialog card, the narrowed dialog width and the two-button footer.
 */
const meta = {
  title: 'Studio/Free Trial Dialog',
  component: FreeTrialDialogContentStory,
} satisfies Meta<typeof FreeTrialDialogContentStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Your trial has ended')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('See plans')).toBeVisible()
    await expect(body.getByText('Maybe later')).toBeVisible()
  },
}
