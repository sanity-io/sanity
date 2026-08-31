import {type Meta, type StoryObj} from '@storybook/react-vite'

import {RequestErrorDialogStory} from './RequestErrorDialogStory'

/**
 * Reuses the in-package harness: request-error dialog after the ui5
 * Flex/Box migration. Retryable network chrome; no countdown.
 */
const meta = {
  title: 'Studio/Request Error Dialog',
  component: RequestErrorDialogStory,
  parameters: {chromatic: {delay: 4000}},
} satisfies Meta<typeof RequestErrorDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const NetworkRetryable: Story = {
  // Dialog auto-focuses the first link; blur so Chromatic does not snapshot a
  // focus ring that depends on which control won focus this run.
  play: async () => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
  },
}
