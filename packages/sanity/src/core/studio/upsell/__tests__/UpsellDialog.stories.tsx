import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {UpsellDialogStory} from './UpsellDialogStory'

/**
 * Chromatic sentinel: upsell modal after the ui5 Flex/Box migration (cover
 * image, floating close button, Portable Text body, footer CTA pair). Static
 * Portable Text fixture; inline SVG image; no network.
 */
const meta = {
  title: 'Studio/Upsell Dialog',
  component: UpsellDialogStory,
} satisfies Meta<typeof UpsellDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const WithImage: Story = {
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
