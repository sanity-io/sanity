import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CopyToReleaseMenuGroupStory} from './CopyToReleaseMenuGroupStory'

/**
 * styled-components sentinel for the "Copy version to" menu group row in its
 * enabled, permission-less and disabled states. The submenu with the styled
 * release list stays closed; releases are fixtures.
 */
const meta = {
  title: 'Releases/Copy To Release Menu Group',
  component: CopyToReleaseMenuGroupStory,
} satisfies Meta<typeof CopyToReleaseMenuGroupStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  // TestWrapper suspends on the mock workspace; wait for the rows to paint.
  play: async () => {
    const body = within(document.body)
    await waitFor(
      () => expect(body.getAllByTestId('copy-version-to-release-button-group')).toHaveLength(3),
      {timeout: 5000},
    )
    await expect(body.getAllByText('Copy version to')).toHaveLength(3)
  },
}
