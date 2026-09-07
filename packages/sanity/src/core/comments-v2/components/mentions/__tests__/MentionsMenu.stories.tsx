import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MentionsMenuStory} from './MentionsMenuStory'

/**
 * Chromatic sentinel: post-migration ui5 comments-v2 mentions empty state.
 * Populated rows need useUser and are omitted.
 */
const meta = {
  title: 'Comments (v2)/Mentions Menu',
  component: MentionsMenuStory,
} satisfies Meta<typeof MentionsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
