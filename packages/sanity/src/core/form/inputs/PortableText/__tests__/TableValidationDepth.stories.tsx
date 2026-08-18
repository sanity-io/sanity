import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableValidationDepthStory} from './TableValidationDepthStory'

/**
 * Reuses the `TableValidationDepth.browser.test.tsx` harness: Portable Text
 * editors nested inside table-like structures, verifying validation markers
 * at depth.
 */
const meta = {
  title: 'Portable Text/Table Validation Depth',
  component: TableValidationDepthStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TableValidationDepthStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
