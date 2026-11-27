import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ScheduledDraftsEmptyStateStory} from './ScheduledDraftsEmptyStateStory'

/**
 * Chromatic sentinel: scheduled-drafts empty state after the ui5 Flex
 * migration, framed in a centered flex parent. Inline SVG illustration; no
 * live drafts.
 */
const meta = {
  title: 'Releases/Scheduled Drafts Empty State',
  component: ScheduledDraftsEmptyStateStory,
} satisfies Meta<typeof ScheduledDraftsEmptyStateStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
