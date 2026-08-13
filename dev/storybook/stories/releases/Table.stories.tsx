import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableStory} from '../../../../packages/sanity/src/core/releases/tool/components/Table/__tests__/TableStory'

/**
 * Reuses the `Table.browser.test.tsx` harness: the releases tool table with a
 * basic column definition and four rows.
 */
const meta = {
  title: 'Releases/Table',
  component: TableStory,
} satisfies Meta<typeof TableStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
