import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DevServerStoppedErrorScreen} from '../ViteDevServerStopped'

/**
 * Chromatic sentinel for the dev-server-stopped error screen after the ui5
 * Stack to VStack migration: a critical full-height Card with a heading over
 * a bordered inherit-tone Card, both spaced by the stacks the swap replaces.
 * Copy is hardcoded in the component (no i18n, no timestamps).
 */
const meta = {
  title: 'Studio/Dev Server Stopped',
  component: DevServerStoppedErrorScreen,
} satisfies Meta<typeof DevServerStoppedErrorScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div style={{height: 320}}>
      <DevServerStoppedErrorScreen />
    </div>
  ),
}
