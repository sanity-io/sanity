import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorActionsStory} from './ErrorActionsStory'

/**
 * Chromatic sentinel: shared error-boundary Retry / Copy error details
 * row after the `@sanity/ui` Inline layout. Fixture error only; no toast.
 */
const meta = {
  title: 'Core/Error Actions',
  component: ErrorActionsStory,
} satisfies Meta<typeof ErrorActionsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
