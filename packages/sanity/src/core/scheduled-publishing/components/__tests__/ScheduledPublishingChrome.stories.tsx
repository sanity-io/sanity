import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ScheduledPublishingChromeStory} from './ScheduledPublishingChromeStory'

/**
 * Reuses the in-package harness: scheduled-publishing error/info callouts and
 * empty states after the ui5 Flex migration. No dates or live dataset rows.
 */
const meta = {
  title: 'Scheduled Publishing/Chrome',
  component: ScheduledPublishingChromeStory,
} satisfies Meta<typeof ScheduledPublishingChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
