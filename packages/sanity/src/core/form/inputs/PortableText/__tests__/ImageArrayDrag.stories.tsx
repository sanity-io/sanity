import {type Meta, type StoryObj} from '@storybook/react-vite'

import ImageArrayDragStory from './ImageArrayDragStory'

/**
 * Reuses the `ImageArrayDrag.browser.test.tsx` harness: an image array next
 * to a Portable Text input, used to verify cross-input drag behavior.
 */
const meta = {
  title: 'Portable Text/Image Array Drag',
  component: ImageArrayDragStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ImageArrayDragStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
