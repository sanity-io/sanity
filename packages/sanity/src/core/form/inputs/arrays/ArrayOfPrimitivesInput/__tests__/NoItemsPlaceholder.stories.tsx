import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NoItemsPlaceholderStory} from './NoItemsPlaceholderStory'

/**
 * Reuses the in-package harness: empty array Card padding, muted Text, and
 * critical tone when the field has errors. Copy is a fixture.
 */
const meta = {
  title: 'Form/No Items Placeholder',
  component: NoItemsPlaceholderStory,
} satisfies Meta<typeof NoItemsPlaceholderStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
