import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsInputStory} from '../../../../packages/sanity/src/core/comments/components/pte/comment-input/__tests__/CommentInputStory'

/**
 * Reuses the `CommentInput.browser.test.tsx` harness: the comment input with
 * mention support, focused on mount (so the snapshot captures the focused
 * state deterministically).
 */
const meta = {
  title: 'Comments/Comment Input',
  component: CommentsInputStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof CommentsInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    value: [
      {
        _type: 'block',
        _key: 'a',
        style: 'normal',
        markDefs: [],
        children: [{_type: 'span', _key: 'a1', text: 'A comment in progress', marks: []}],
      },
    ],
  },
}
