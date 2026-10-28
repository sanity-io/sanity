import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {GlobalPerspectiveButtonStory} from './GlobalPerspectiveButtonStory'

/**
 * Shared chip for the global perspective pickers. Covers the default trigger
 * and the selected state, where the clear control is shown beside the label.
 * The label width animation settles before the snapshot.
 */
const meta = {
  title: 'Perspective/Global Perspective Button',
  component: GlobalPerspectiveButtonStory,
  parameters: {chromatic: {delay: 400}},
} satisfies Meta<typeof GlobalPerspectiveButtonStory>

export default meta
type Story = StoryObj<typeof meta>

/** Default chip, and the same chip once a perspective is selected. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the chips
    // are not in the canvas on the first frame.
    const idle = await canvas.findByTestId('global-perspective-button-idle', undefined, {
      timeout: 5000,
    })
    const selected = await canvas.findByTestId('global-perspective-button-selected', undefined, {
      timeout: 5000,
    })

    await expect(within(idle).getByRole('button', {name: 'All users'})).toBeVisible()
    await expect(within(idle).queryByRole('button', {name: 'Clear selection'})).toBeNull()

    await expect(within(selected).getByRole('button', {name: 'Norwegian market'})).toBeVisible()
    await expect(within(selected).getByRole('button', {name: 'Clear selection'})).toBeVisible()
  },
}
