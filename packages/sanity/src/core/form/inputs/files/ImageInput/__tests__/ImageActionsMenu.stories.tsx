import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ImageActionsMenuOpenStory, ImageActionsMenuStory} from './ImageActionsMenuStory'

/**
 * Chromatic sentinel for image/file input action chrome (crop button +
 * options overlay). Closed crop/options and options-only states. The open
 * menu is a separate story so Chromatic captures Download / Copy URL /
 * Clear field together.
 */
const meta = {
  title: 'Form/Image Actions Menu',
  component: ImageActionsMenuStory,
} satisfies Meta<typeof ImageActionsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  render: () => <ImageActionsMenuOpenStory />,
  parameters: {chromatic: {delay: 300}},
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('menuitem', {name: 'Clear field'})).toBeVisible(), {
      timeout: 5000,
    })
  },
}
