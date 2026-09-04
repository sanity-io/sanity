import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentInspectorErrorBoundaryStory} from './DocumentInspectorErrorBoundaryStory'

/**
 * Chromatic sentinel: post-migration ui5 inspector error boundary.
 * Critical card, fixture error message, and retry — the inspector stays
 * contained instead of taking down the structure tool.
 */
const meta = {
  title: 'Structure/Inspector Error Boundary',
  component: DocumentInspectorErrorBoundaryStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof DocumentInspectorErrorBoundaryStory>

export default meta
type Story = StoryObj<typeof meta>

export const Caught: Story = {}
