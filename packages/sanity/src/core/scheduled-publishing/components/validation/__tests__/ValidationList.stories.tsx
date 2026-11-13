import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ValidationListStory} from './ValidationListStory'

/**
 * Reuses the in-package harness: ui5 Container wrapping error/warning/info
 * rows and a truncated long warning. Field titles resolve from a fixture
 * schema. Messages are static.
 */
const meta = {
  title: 'Scheduled Publishing/Validation List',
  component: ValidationListStory,
} satisfies Meta<typeof ValidationListStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
