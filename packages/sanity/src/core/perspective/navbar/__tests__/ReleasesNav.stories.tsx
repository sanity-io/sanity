import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {ReleasesNavStory} from './ReleasesNavStory'

/**
 * Reuses the in-package harness: the classic releases navbar pill (Drafts
 * label and chevron) after the ui5 Text / Box migration. The label width
 * spring settles before capture.
 */
const meta = {
  title: 'Perspective/Releases Nav',
  component: ReleasesNavStory,
} satisfies Meta<typeof ReleasesNavStory>

export default meta
type Story = StoryObj<typeof meta>

/** Drafts selected; the menu stays closed so the snapshot is the pill chrome. */
export const Closed: Story = {
  parameters: {chromatic: {delay: 400}},
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the pill
    // is not in the canvas on the first frame.
    const nav = await canvas.findByTestId('releases-nav-idle', undefined, {timeout: 5000})
    await waitFor(() => expect(within(nav).getByText('Drafts')).toBeVisible(), {timeout: 3000})
  },
}
