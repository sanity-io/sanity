import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, waitFor, within} from 'storybook/test'

import {ActivateOnFocusStory} from './ActivateOnFocusStory'

/**
 * Chromatic sentinel: Portable Text activate-on-focus overlay after the ui5
 * Text migration. Fixture copy; play hovers the overlay so the message is
 * visible (it is opacity 0 until hover).
 */
const meta = {
  title: 'Form/Activate On Focus',
  component: ActivateOnFocusStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ActivateOnFocusStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const [overlay] = await canvas.findAllByTestId('activate-overlay', {}, {timeout: 5_000})
    await userEvent.hover(overlay)
    await waitFor(() => expect(overlay).toHaveTextContent('Activate this field'))
  },
}
