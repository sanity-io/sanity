import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentBreadcrumbsStory} from './CommentBreadcrumbsStory'

/**
 * Recently migrated onto ui5 `Box` (`as="li"` plus truncated overflow). A
 * visual sentinel for Box spacing/overflow when the rest of comments keeps
 * moving off `@sanity/ui` Box. Paths are static — no timestamps or live data.
 */
const meta = {
  title: 'Comments (v2)/Comment Breadcrumbs',
  component: CommentBreadcrumbsStory,
} satisfies Meta<typeof CommentBreadcrumbsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
