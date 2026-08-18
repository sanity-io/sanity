import {type Meta, type StoryObj} from '@storybook/react-vite'

import DragAndDropStory from './DragAndDropStory'

/**
 * Reuses the `DragAndDrop.browser.test.tsx` harness: a Portable Text input
 * with draggable object blocks.
 */
const meta = {
  title: 'Portable Text/Drag And Drop',
  component: DragAndDropStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof DragAndDropStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
