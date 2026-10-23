import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TableEmptyStateStory} from './TableEmptyStateStory'

/**
 * Chromatic sentinel: releases table empty row (Card as tr) plus
 * TableLayout's empty grid. Fixture copy only.
 */
const meta = {
  title: 'Releases/Table Empty State',
  component: TableEmptyStateStory,
} satisfies Meta<typeof TableEmptyStateStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
