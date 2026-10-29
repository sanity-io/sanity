import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentVersionsStatusIndicatorStory} from './DocumentVersionsStatusIndicatorStory'

/**
 * Status icons on document list rows, grouped the way Studio shows them: one
 * perspective at a time, with and without a variant selected.
 */
const meta = {
  title: 'Studio/Document Status Indicator',
  component: DocumentVersionsStatusIndicatorStory,
} satisfies Meta<typeof DocumentVersionsStatusIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
