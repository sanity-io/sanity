import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentInlineHighlightStory} from './CommentInlineHighlightStory'

/**
 * Chromatic sentinel: comments-v2 inline highlight hues (added, nested,
 * hovered, authoring). Fixture copy only.
 */
const meta = {
  title: 'Comments (v2)/Inline Highlight',
  component: CommentInlineHighlightStory,
} satisfies Meta<typeof CommentInlineHighlightStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
