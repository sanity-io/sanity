import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FreeTrialPopoverContentStory} from './FreeTrialPopoverContentStory'

/**
 * Chromatic sentinel: free-trial popover after the ui5 Flex/Box migration.
 * Fixture copy, no image.
 */
const meta = {
  title: 'Studio/Free Trial Popover',
  component: FreeTrialPopoverContentStory,
} satisfies Meta<typeof FreeTrialPopoverContentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // Both CTAs set autoFocus; React commits them in tree order so the last one
  // wins deterministically. Blur it so the snapshot stays focus-neutral.
  play: () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
