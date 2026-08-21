import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MentionsMenuStory} from './MentionsMenuStory'

/**
 * Reuses the in-package harness: ui5 Box empty-state padding when no users
 * match. Populated rows need useUser and are omitted.
 */
const meta = {
  title: 'Comments/Mentions Menu',
  component: MentionsMenuStory,
} satisfies Meta<typeof MentionsMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}
