import {type Meta, type StoryObj} from '@storybook/react-vite'
import {userEvent, within} from 'storybook/test'

import {PublishedEventMenuStory} from './PublishedEventMenuStory'

/**
 * Reuses the in-package harness: the published-event ellipsis menu for a
 * draft publish. Play opens the menu so Chromatic captures the VersionBadge
 * label on the MenuItem, not a closed trigger (already covered by Context
 * Menu Button).
 */
const meta = {
  title: 'Structure/Published Event Menu',
  component: PublishedEventMenuStory,
} satisfies Meta<typeof PublishedEventMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', {name: 'Open action menu'}, {timeout: 10_000}),
    )
    const body = within(document.body)
    await body.findByRole('menuitem', {name: /Open draft document/}, {timeout: 3000})
  },
}
