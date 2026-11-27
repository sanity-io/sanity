import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DiffErrorBoundaryStory} from './DiffErrorBoundaryStory'

/**
 * Chromatic sentinel: review-changes error boundary (critical Card + ui5
 * Icon/Text) after a child preview throws. Fixture copy only.
 */
const meta = {
  title: 'Field/Diff Error Boundary',
  component: DiffErrorBoundaryStory,
} satisfies Meta<typeof DiffErrorBoundaryStory>

export default meta
type Story = StoryObj<typeof meta>

export const Caught: Story = {}
