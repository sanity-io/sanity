import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {PaneItemStory} from './PaneItemStory'

/**
 * Chromatic sentinel: list-pane count badge states. Fixture counts only.
 */
const meta = {
  title: 'Structure/Pane Item Count',
  component: PaneItemStory,
} satisfies Meta<typeof PaneItemStory>

export default meta
type Story = StoryObj<typeof meta>

/** The locale provider suspends, so wait for the formatted badges before capturing. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getAllByTestId('pane-item-count')).toHaveLength(4))
  },
}
