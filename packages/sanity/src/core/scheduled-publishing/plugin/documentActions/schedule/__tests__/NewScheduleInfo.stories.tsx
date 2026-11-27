import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NewScheduleInfoStory} from './NewScheduleInfoStory'

/**
 * Reuses the in-package harness: schedule-action info copy after the ui5
 * VStack migration.
 */
const meta = {
  title: 'Scheduled Publishing/New Schedule Info',
  component: NewScheduleInfoStory,
} satisfies Meta<typeof NewScheduleInfoStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
