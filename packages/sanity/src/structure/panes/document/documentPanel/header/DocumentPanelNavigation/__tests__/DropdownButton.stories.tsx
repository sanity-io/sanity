import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {DropdownButtonStory} from './DropdownButtonStory'

/**
 * Pill trigger of the document panel navigation menus. Covers the default trigger, the selected
 * state with the remove control beside the label, and a long label.
 */
const meta = {
  title: 'Structure/Document Panel Navigation/Dropdown Button',
  component: DropdownButtonStory,
} satisfies Meta<typeof DropdownButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the pills are not in the canvas
    // on the first frame.
    const idle = await canvas.findByTestId('dropdown-button-idle', undefined, {timeout: 5000})
    const selected = await canvas.findByTestId('dropdown-button-selected', undefined, {
      timeout: 5000,
    })

    await expect(within(idle).getByRole('button', {name: 'Variants'})).toBeVisible()
    await expect(within(idle).queryByRole('button', {name: 'Clear selection'})).toBeNull()

    await expect(within(selected).getByRole('button', {name: 'First-time visitors'})).toBeVisible()
    await expect(within(selected).getByRole('button', {name: 'Clear selection'})).toBeVisible()
  },
}
