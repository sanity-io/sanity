import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {FormHeaderStory} from './FormHeaderStory'

/**
 * Chromatic sentinel: document form header. Container-query heading
 * sizes, untitled muted, clickable PressArea, singleton, description
 * icon. Fixture titles only.
 */
const meta = {
  title: 'Structure/Form Header',
  component: FormHeaderStory,
} satisfies Meta<typeof FormHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

/** TestWrapper suspends on the mock workspace. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const titles = await canvas.findAllByTestId('document-panel-document-title')
    await expect(titles).toHaveLength(7)
  },
}
