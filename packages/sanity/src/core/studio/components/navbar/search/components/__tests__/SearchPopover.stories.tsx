import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {SearchPopoverStory} from './SearchPopoverStory'

/**
 * Chromatic sentinel for the open global search popover with its empty recent
 * searches state and the filter row. Fixture schema only; no live queries.
 */
const meta = {
  title: 'Studio/Search Popover',
  component: SearchPopoverStory,
} satisfies Meta<typeof SearchPopoverStory>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  // TestWrapper suspends on the mock workspace; wait for the popover to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByPlaceholderText('Search')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('All types')).toBeVisible()
    await expect(body.getByText('Add filter')).toBeVisible()
  },
}
