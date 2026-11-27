import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {PerspectiveDetailLinkStory} from './PerspectiveDetailLinkStory'

/**
 * Reuses the in-package harness: the perspective-menu detail link and the
 * reserved space it occupies in the row. The menu stays a static list. A
 * second row forces the Launch link visible without a hover play.
 */
const meta = {
  title: 'Perspective/Perspective Detail Link',
  component: PerspectiveDetailLinkStory,
} satisfies Meta<typeof PerspectiveDetailLinkStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    // TestWrapper resolves its mock workspace asynchronously, so the rows
    // are not in the canvas on the first frame.
    await canvas.findByTestId('detail-link-row', undefined, {timeout: 5000})
  },
}
