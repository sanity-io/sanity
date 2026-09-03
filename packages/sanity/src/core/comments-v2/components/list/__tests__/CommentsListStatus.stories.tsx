import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsListStatusStory} from './CommentsListStatusStory'

/**
 * Chromatic sentinel: post-migration ui5 comments-v2 list empty and error
 * states. Fixture copy only; loading spinner omitted.
 */
const meta = {
  title: 'Comments (v2)/List Status',
  component: CommentsListStatusStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof CommentsListStatusStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
