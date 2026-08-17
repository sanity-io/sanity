import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsListItemReferencedValueStory} from '../../../../packages/sanity/src/core/comments/components/list/__tests__/CommentsListItemReferencedValueStory'

/**
 * Reuses the in-package harness: ui5 Box quote with/without the missing-value
 * icon. Quote text is a static portable-text fixture (no timestamps).
 */
const meta = {
  title: 'Comments/Referenced Value',
  component: CommentsListItemReferencedValueStory,
} satisfies Meta<typeof CommentsListItemReferencedValueStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
