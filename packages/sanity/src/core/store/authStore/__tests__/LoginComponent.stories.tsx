import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {LoginComponentStory} from './LoginComponentStory'

/**
 * The studio login screen from `createLoginComponent`: the provider chooser
 * and the "No login providers available" caution card. `play` waits for the
 * providers effect to settle so the loading block is never captured.
 */
const meta = {
  title: 'Auth/Login Component',
  component: LoginComponentStory,
} satisfies Meta<typeof LoginComponentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper suspends while the mock workspace resolves, then the
    // providers effect runs; wait for both screens before capture.
    const link = await canvas.findByRole('link', {name: 'E-mail / password'}, {timeout: 5000})
    await waitFor(() => expect(link).toBeVisible())
    await waitFor(() => expect(canvas.getByText('No login providers available')).toBeVisible())
  },
}
