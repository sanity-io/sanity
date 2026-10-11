import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ValidationListItemStory} from './ValidationListItemStory'

/**
 * Reuses the in-package harness: Box padding and MenuItem tones on scheduled
 * publishing validation rows. Messages are static fixtures.
 */
const meta = {
  title: 'Scheduled Publishing/Validation List Item',
  component: ValidationListItemStory,
} satisfies Meta<typeof ValidationListItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
