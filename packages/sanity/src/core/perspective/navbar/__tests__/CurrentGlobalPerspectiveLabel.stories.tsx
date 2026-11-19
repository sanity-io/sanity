import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, waitFor, within} from 'storybook/test'

import {CurrentGlobalPerspectiveLabelStory} from './CurrentGlobalPerspectiveLabelStory'

/**
 * The label the navbar shows for the selected global perspective: Published, Drafts, a release
 * (a link to the release, truncated past 180px) and an agent bundle.
 */
const meta = {
  title: 'Perspective/Current Global Perspective Label',
  component: CurrentGlobalPerspectiveLabelStory,
  // The label animates its width to the measured text width on mount.
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof CurrentGlobalPerspectiveLabelStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously.
    await waitFor(() => expect(canvas.getByText('Published')).toBeVisible(), {timeout: 5000})
    await waitFor(() => expect(canvas.getByText('active Release')).toBeVisible())
    await waitFor(() => expect(canvas.getByText('Agent changes')).toBeVisible())
  },
}
