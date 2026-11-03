import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {PaneChromeStory} from './PaneChromeStory'

/**
 * Chromatic sentinel for the structure tool's pane chrome ahead of its
 * styled-components and `ui5` migrations: the loading, error and unknown
 * panes with the dividers between them, a list pane with its divider items
 * next to resizable and fixed pane dividers, the styled primitives behind the
 * pane header, content, footer and layout, the "no document types" screen
 * and the structure resolution error screen.
 */
const meta = {
  title: 'Structure/Pane Chrome',
  component: PaneChromeStory,
} satisfies Meta<typeof PaneChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByText('Resolving authors…')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('Could not load')).toBeVisible()
    await expect(body.getByText('Posts')).toBeVisible()
    await expect(body.getByText('Settings')).toBeVisible()
    await expect(body.getByText('Unknown pane type')).toBeVisible()
    await expect(body.getByText('No document types')).toBeVisible()
    await expect(body.getByText('View documentation')).toBeVisible()
    await expect(body.getByText('Footer root card')).toBeVisible()
  },
}
