import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {LegacyLoginComponentStory} from './LegacyLoginComponentStory'

/**
 * The login provider chooser from `createLoginComponent` in the legacy auth store: a list of
 * providers (with and without a known logo), and the warning shown when none are configured.
 */
const meta = {
  title: 'Auth/Legacy Login Component',
  component: LegacyLoginComponentStory,
} satisfies Meta<typeof LegacyLoginComponentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, then the providers load in an effect.
    await waitFor(() => expect(canvas.getByText('Choose login provider')).toBeVisible(), {
      timeout: 5000,
    })
    await waitFor(() => expect(canvas.getByText('Company SSO')).toBeVisible())
    await waitFor(() => expect(canvas.getByText('No login providers available')).toBeVisible())
  },
}
