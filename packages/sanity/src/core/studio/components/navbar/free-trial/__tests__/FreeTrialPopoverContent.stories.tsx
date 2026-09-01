import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FreeTrialPopoverContentStory} from './FreeTrialPopoverContentStory'

/**
 * Reuses the in-package harness: free-trial popover after the ui5
 * Flex/Box migration. Fixture copy, no image.
 */
const meta = {
  title: 'Studio/Free Trial Popover',
  component: FreeTrialPopoverContentStory,
} satisfies Meta<typeof FreeTrialPopoverContentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // CTA autoFocuses; blur so Chromatic does not snapshot a focus ring
  // that depends on which button won focus this run.
  play: async () => {
    const active = document.activeElement
    if (active instanceof HTMLElement) active.blur()
  },
}
