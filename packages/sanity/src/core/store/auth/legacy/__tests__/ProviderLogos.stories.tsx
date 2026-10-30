import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ProviderLogosStory} from './ProviderLogosStory'

/**
 * Styled-components sentinel for the legacy login provider logos: Google,
 * GitHub, a custom provider with a logo and a custom provider without one.
 */
const meta = {
  title: 'Studio/Auth Provider Logos',
  component: ProviderLogosStory,
} satisfies Meta<typeof ProviderLogosStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('GitHub')).toBeVisible(), {timeout: 5000})
    await expect(body.getByTestId('provider-logo-google').querySelector('svg')).not.toBeNull()
    await expect(body.getByTestId('provider-logo-github').querySelector('svg')).not.toBeNull()
    await expect(body.getByAltText('Logo for acme-sso')).toBeVisible()
    // `@sanity/ui`'s Text wraps its children in a span; the custom logo without a URL renders nothing into it.
    const oktaLogo = body.getByTestId('provider-logo-okta')
    await expect(oktaLogo).toBeVisible()
    await expect(oktaLogo.querySelectorAll('img, svg')).toHaveLength(0)
  },
}
