import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {SearchShellStory} from './SearchShellStory'

/**
 * Chromatic sentinel for the global search shell: compact and fullscreen
 * headers, the custom text input box, the filter toolbar buttons and pill, the
 * add-filter menu row, the date "last N units" input and debug score overlays.
 * Fixture schema only; no live queries.
 */
const meta = {
  title: 'Studio/Search Shell',
  component: SearchShellStory,
} satisfies Meta<typeof SearchShellStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    // The pane fades in after it has measured itself, so wait for visibility, not presence.
    await waitFor(() => expect(body.getByText('debug overlays')).toBeVisible(), {
      timeout: 5000,
    })
    // The compact and fullscreen headers each render the search input.
    await expect(body.getAllByPlaceholderText('Search')).toHaveLength(2)
    await expect(body.getByText('score: 0.8')).toBeVisible()
    await expect(body.getByDisplayValue('shaded box')).toBeVisible()
  },
}
