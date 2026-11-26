import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {DocumentInspectorErrorBoundaryStory} from './DocumentInspectorErrorBoundaryStory'

/**
 * Chromatic sentinel: inspector crash fallback. Header, critical card,
 * and retry button. Fixture error message only.
 */
const meta = {
  title: 'Structure/Document Inspector Error Boundary',
  component: DocumentInspectorErrorBoundaryStory,
} satisfies Meta<typeof DocumentInspectorErrorBoundaryStory>

export default meta
type Story = StoryObj<typeof meta>

/** TestWrapper suspends on the mock workspace; the throw is caught on commit. */
export const Caught: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('button', {name: 'Retry'})
  },
}
