import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {PresentationNarrowTabBarStory} from './PresentationNarrowTabBarStory'

/**
 * Reuses the in-package harness: Presentation's narrow-viewport tab bar
 * after the ui5 Flex migration. `play` waits for the locale bundle so
 * Chromatic does not snapshot unresolved keys.
 */
const meta = {
  title: 'Presentation/Narrow Tab Bar',
  component: PresentationNarrowTabBarStory,
} satisfies Meta<typeof PresentationNarrowTabBarStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getAllByRole('tab', {name: 'Presentation'}).length).toBe(3), {
      timeout: 3000,
    })
  },
}
