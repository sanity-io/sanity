import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsInspectorUnavailableStory} from './CommentsInspectorUnavailableStory'

/**
 * Comments-v2 inspector unavailable state, shown when the plan check failed and the inspector was
 * still opened (menu item, field button, link). The ui5 `Flex` header mirrors the regular
 * inspector header's geometry without sharing its component, so this pins that layout and the
 * muted message beneath it.
 */
const meta = {
  title: 'Comments (v2)/Inspector Unavailable',
  component: CommentsInspectorUnavailableStory,
} satisfies Meta<typeof CommentsInspectorUnavailableStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
