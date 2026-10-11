import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsListStatusStory} from './CommentsListStatusStory'

/**
 * Reuses the in-package harness: ui5 Flex centering and padding on comments
 * empty/error states after the Flex migration. Loading is omitted.
 */
const meta = {
  title: 'Comments/List Status',
  component: CommentsListStatusStory,
} satisfies Meta<typeof CommentsListStatusStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
