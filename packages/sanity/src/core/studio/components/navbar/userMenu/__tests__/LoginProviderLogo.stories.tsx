import {type Meta, type StoryObj} from '@storybook/react-vite'

import {LoginProviderLogoStory} from './LoginProviderLogoStory'

/**
 * Reuses the in-package harness: login-provider overlay on a size-2 user
 * avatar (google, github, sanity, saml, unknown, none). The UserMenu browser
 * test never paints this overlay.
 */
const meta = {
  title: 'Studio/Login Provider Logo',
  component: LoginProviderLogoStory,
} satisfies Meta<typeof LoginProviderLogoStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
