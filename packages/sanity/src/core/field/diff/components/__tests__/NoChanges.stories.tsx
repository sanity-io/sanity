import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NoChangesStory} from './NoChangesStory'

/**
 * Chromatic sentinel: review-changes NoChanges empty state after the ui5
 * Flex migration. Static i18n copy; no document values.
 */
const meta = {
  title: 'Field/No Changes',
  component: NoChangesStory,
} satisfies Meta<typeof NoChangesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
