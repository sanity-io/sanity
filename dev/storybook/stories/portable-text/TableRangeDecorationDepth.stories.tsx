import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableRangeDecorationDepthStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/TableRangeDecorationDepthStory'

/**
 * Reuses the `TableRangeDecorationDepth.browser.test.tsx` harness: Portable
 * Text editors nested inside table-like structures, verifying range
 * decorations at depth.
 */
const meta = {
  title: 'Portable Text/Table Range Decoration Depth',
  component: TableRangeDecorationDepthStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof TableRangeDecorationDepthStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
