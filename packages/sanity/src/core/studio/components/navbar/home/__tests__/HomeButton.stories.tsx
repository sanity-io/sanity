import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {HomeButtonStory} from './HomeButtonStory'

/**
 * Reuses the in-package harness: 25px rounded logo mark and Flex centering
 * on the navbar home control after the ui5 Flex migration.
 */
const meta = {
  title: 'Studio/Home Button',
  component: HomeButtonStory,
} satisfies Meta<typeof HomeButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  // TestWrapper suspends on the mock workspace. Wait for the home link
  // rather than `toBeVisible()`: addon-vitest can keep `canvasElement`
  // mounted but not visible, which fails `checkVisibility`.
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('link', {}, {timeout: 5000})
  },
}
