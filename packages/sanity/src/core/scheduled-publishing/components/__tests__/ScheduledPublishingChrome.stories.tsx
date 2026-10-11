import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ScheduledPublishingChromeStory} from './ScheduledPublishingChromeStory'

/**
 * Chromatic sentinel: scheduled-publishing error/info callouts and empty
 * states (including the fixed selected-date heading) after the ui5 Flex
 * migration, framed in their production Container wrappers. No live dataset
 * rows.
 */
const meta = {
  title: 'Scheduled Publishing/Chrome',
  component: ScheduledPublishingChromeStory,
} satisfies Meta<typeof ScheduledPublishingChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
