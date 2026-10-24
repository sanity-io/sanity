import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {SearchDialogStory} from './SearchDialogStory'

/**
 * Chromatic sentinel for the fullscreen search dialog with its header, filter
 * toggle and empty recent searches state. Fixture schema only; no live queries.
 */
const meta = {
  title: 'Studio/Search Dialog',
  component: SearchDialogStory,
} satisfies Meta<typeof SearchDialogStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace; wait for the dialog to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByPlaceholderText('Search')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByLabelText('Close search')).toBeVisible()
  },
}
