import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsFieldButtonStory} from './CommentsFieldButtonStory'

/**
 * Chromatic sentinel: comments-v2 field button after the ui5 Flex/Text/Icon
 * migration. Closed count badges only (1 / 3 / 9+). Fixture copy only.
 */
const meta = {
  title: 'Comments (v2)/Field Button',
  component: CommentsFieldButtonStory,
} satisfies Meta<typeof CommentsFieldButtonStory>

export default meta
type Story = StoryObj<typeof meta>

export const Counts: Story = {}
