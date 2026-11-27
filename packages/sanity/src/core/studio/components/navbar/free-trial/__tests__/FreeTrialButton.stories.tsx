import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {FreeTrialButtonStory} from './FreeTrialButtonStory'

/**
 * Chromatic sentinel: free-trial topbar progress ring and sidebar bleed
 * button after the ui5 Icon migration. Tooltips stay closed.
 */
const meta = {
  title: 'Studio/Free Trial Button',
  component: FreeTrialButtonStory,
} satisfies Meta<typeof FreeTrialButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace. Wait for the sidebar copy,
  // then blur so the snapshot stays focus-neutral. Do not hover: the topbar
  // tooltip would otherwise open.
  play: async () => {
    const body = within(document.body)
    await waitFor(
      () => expect(body.getByRole('button', {name: 'Upgrade from free'})).toBeVisible(),
      {timeout: 5_000},
    )
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
