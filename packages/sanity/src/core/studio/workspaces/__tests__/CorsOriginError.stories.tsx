import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CorsOriginErrorStory} from './CorsOriginErrorStory'

/**
 * Reuses the in-package harness: CORS origin error screen after the ui5 Box
 * migration. Fixed origin/project IDs; no live CORS probe.
 */
const meta = {
  title: 'Studio/CORS Origin Error',
  component: CorsOriginErrorStory,
} satisfies Meta<typeof CorsOriginErrorStory>

export default meta
type Story = StoryObj<typeof meta>

export const NotConnected: Story = {
  args: {variant: 'not-connected'},
}

export const CredentialsDisabled: Story = {
  args: {variant: 'credentials-disabled'},
}
