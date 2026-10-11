import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentVersionsStatusIndicatorStory} from './DocumentVersionsStatusIndicatorStory'

/**
 * List-row status icons: draft-only ring, published disc, and both together.
 */
const meta = {
  title: 'Studio/Document Status Indicator',
  component: DocumentVersionsStatusIndicatorStory,
} satisfies Meta<typeof DocumentVersionsStatusIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
