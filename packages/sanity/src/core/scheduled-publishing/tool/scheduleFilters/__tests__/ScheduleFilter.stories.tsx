import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ScheduleFilterStory} from './ScheduleFilterStory'

/**
 * Reuses the in-package harness: scheduled-publishing filter pills after the
 * ui5 Flex migration.
 */
const meta = {
  title: 'Scheduled Publishing/Schedule Filter',
  component: ScheduleFilterStory,
} satisfies Meta<typeof ScheduleFilterStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
