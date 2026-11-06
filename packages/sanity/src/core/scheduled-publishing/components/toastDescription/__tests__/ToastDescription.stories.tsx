import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ToastDescriptionStory} from './ToastDescriptionStory'

/**
 * Reuses the in-package harness: scheduled-publishing toast title/body after
 * the ui5 Flex migration.
 */
const meta = {
  title: 'Scheduled Publishing/Toast Description',
  component: ToastDescriptionStory,
} satisfies Meta<typeof ToastDescriptionStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
