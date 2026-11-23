import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {StructureErrorStory} from './StructureErrorStory'

/**
 * Chromatic sentinel: full-page structure error chrome. SerializeError
 * fixtures only — no stack traces, no live structure builder.
 */
const meta = {
  title: 'Structure/Structure Error',
  component: StructureErrorStory,
} satisfies Meta<typeof StructureErrorStory>

export default meta
type Story = StoryObj<typeof meta>

/** TestWrapper suspends on the mock workspace. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const buttons = await canvas.findAllByRole('button', {name: 'Reload'})
    await expect(buttons).toHaveLength(2)
  },
}
