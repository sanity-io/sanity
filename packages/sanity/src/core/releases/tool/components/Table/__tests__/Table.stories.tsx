import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableStory} from './TableStory'

/**
 * Reuses the `Table.browser.test.tsx` harness: the releases tool table with a
 * basic column definition and four rows.
 */
const meta = {
  title: 'Releases/Table',
  component: TableStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof TableStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
