import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, within} from 'storybook/test'

import {ArrayOfObjectOptionsInputStory} from './ArrayOfObjectOptionsInputStory'

/**
 * Reuses the in-package harness: array of predefined object options after the
 * ui5 Grid/Flex migration (list, grid, incompatible type). FormBuilder boot
 * is awaited in play so Chromatic does not archive the empty field chrome.
 */
const meta = {
  title: 'Inputs/Array Of Object Options',
  component: ArrayOfObjectOptionsInputStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ArrayOfObjectOptionsInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    const news = await canvas.findByRole('checkbox', {name: /News/i}, {timeout: 5_000})
    await expect(news).toBeChecked()
  },
}
