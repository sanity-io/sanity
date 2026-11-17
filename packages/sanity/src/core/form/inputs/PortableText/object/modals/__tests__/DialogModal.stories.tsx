import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {DialogModalStory} from './DialogModalStory'

/**
 * Reuses the in-package harness: the Portable Text object-edit dialog after
 * the ui5 Box migration. Play waits for the dialog role, then blurs so the
 * snapshot is not a focus ring on the close button.
 */
const meta = {
  title: 'Portable Text/Object Edit Dialog',
  component: DialogModalStory,
} satisfies Meta<typeof DialogModalStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await body.findByRole('dialog', {}, {timeout: 5000})
    // The dialog root stays `visibility: hidden` (the visible card is a
    // child). Do not assert visibility on the root. Blur so Chromatic does
    // not archive a focus ring on the close button.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  },
}
