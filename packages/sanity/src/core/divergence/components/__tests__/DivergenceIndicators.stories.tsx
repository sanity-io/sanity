import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {DivergenceIndicatorsStory} from './DivergenceIndicatorsStory'

/**
 * Chromatic sentinel: field-gutter divergence pills (collection count vs
 * single, published vs named-version tones, focused bleed). Play waits for
 * the collection button so the motion fade-in has settled; tooltips stay
 * closed.
 */
const meta = {
  title: 'Divergence/Indicators',
  component: DivergenceIndicatorsStory,
  parameters: {chromatic: {delay: 400}},
} satisfies Meta<typeof DivergenceIndicatorsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByRole(
      'button',
      {name: '3 unresolved changes in published version'},
      {timeout: 5000},
    )
  },
}
