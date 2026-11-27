import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {PaneFooterStory} from './PaneFooterStory'

/**
 * Chromatic sentinel: structure pane footer chrome (sticky Layer, Card, ui5
 * Box padding) and the public document-footer data attribute. Fixture copy
 * only.
 */
const meta = {
  title: 'Structure/Pane Footer',
  component: PaneFooterStory,
} satisfies Meta<typeof PaneFooterStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findAllByTestId('pane-footer', {}, {timeout: 5_000})
  },
}
