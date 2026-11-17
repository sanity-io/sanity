import {type Meta, type StoryObj} from '@storybook/react-vite'

import {LinkToCanvasDiffStory} from './LinkToCanvasDiffStory'

/**
 * Reuses the in-package harness: Box padding on the canvas link-confirm
 * warning card and version chips. DocumentDiff is omitted. Delay covers the
 * 300ms fade-in.
 */
const meta = {
  title: 'Canvas/Link To Canvas Diff',
  component: LinkToCanvasDiffStory,
} satisfies Meta<typeof LinkToCanvasDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  parameters: {
    chromatic: {delay: 400},
  },
}
