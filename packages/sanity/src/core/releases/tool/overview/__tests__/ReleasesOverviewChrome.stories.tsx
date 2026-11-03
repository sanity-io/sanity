import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReleasesOverviewChromeStory} from './ReleasesOverviewChromeStory'

/**
 * `@sanity/ui` sentinel for the releases overview chrome: the closed calendar
 * filter trigger (dialog variant) and the empty state with its illustration
 * and action row.
 */
const meta = {
  title: 'Releases/Overview Chrome',
  component: ReleasesOverviewChromeStory,
} satisfies Meta<typeof ReleasesOverviewChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the fixtures to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(() => expect(body.getByTestId('no-releases-info-text')).toBeVisible(), {
      timeout: 5000,
    })
    await expect(body.getByText('New release')).toBeVisible()
    await expect(body.getByText('Documentation')).toBeVisible()
    // The icon-only trigger has no accessible name; it is identified by its `name` attribute.
    await expect(document.body.querySelectorAll('button[name="calendar"]')).toHaveLength(1)
  },
}
