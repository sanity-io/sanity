import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {NoDocumentTypesScreen} from '../NoDocumentTypesScreen'

/**
 * Chromatic sentinel for the empty-schema screen the structure tool shows
 * when no document types are defined: centered caution card, icon column
 * against the stacked title, subtitle and docs link. Copy comes from the
 * structure locale bundle.
 */
const meta = {
  title: 'Structure/No Document Types Screen',
  component: NoDocumentTypesScreen,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <div style={{height: 360}}>
          <Story />
        </div>
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof NoDocumentTypesScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
