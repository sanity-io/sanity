import {type Meta, type StoryObj} from '@storybook/react-vite'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DocumentInspectorErrorBoundary} from '../DocumentInspectorErrorBoundary'

function ThrowingInspector(): never {
  throw new Error("Cannot read properties of undefined (reading 'validation')")
}

/**
 * Chromatic sentinel for the inspector crash screen: the inspector header
 * with its close button, a critical card pairing the icon with the stacked
 * description and message, and the ghost retry button in a ui5 Box. The
 * child throws on render so the boundary's error branch is what gets
 * archived.
 */
const meta = {
  title: 'Structure/Document Inspector Error Boundary',
  component: DocumentInspectorErrorBoundary,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <div style={{height: 320, maxWidth: 360}}>
          <Story />
        </div>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof DocumentInspectorErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

export const InspectorCrashed: Story = {
  args: {
    onClose: noop,
    children: <ThrowingInspector />,
  },
}
