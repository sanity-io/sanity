import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {NavbarAuthChromeStory} from './NavbarAuthChromeStory'

/**
 * Chromatic sentinel for the navbar's home button, the workspace login chooser
 * and auth screen, the login provider badges, the manifest icon renderer and
 * the studio error boundary's default fallback, ahead of their `ui5` and
 * styled-components migrations. Two fixture workspaces: the active one is
 * signed in, the other signed out, so both login status rows render.
 */
const meta = {
  title: 'Studio/Navbar Auth Chrome',
  component: NavbarAuthChromeStory,
} satisfies Meta<typeof NavbarAuthChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('workspace chooser')).toBeVisible(), {
      timeout: 5000,
    })
    // The chooser section, the auth screen and the standalone cards each list both workspaces.
    await expect(body.getAllByText('Production')).toHaveLength(3)
    await expect(body.getAllByText('Staging')).toHaveLength(3)
    await expect(body.getAllByText('Choose your workspace')).toHaveLength(2)
    await expect(body.getByText('The story subtree failed')).toBeVisible()
    await expect(body.getByText('The story child failed on purpose')).toBeVisible()
  },
}
