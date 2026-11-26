import {type Meta, type StoryObj} from '@storybook/react-vite'

import {BlockFallbackStory} from './BlockFallbackStory'

/**
 * Chromatic sentinel: Portable Text lazy-block placeholders after the mixed
 * ui5 Box/Flex and Sanity UI Skeleton swap. Text styles, nested vs
 * fullscreen gutters, and the block-object preview row.
 */
const meta = {
  title: 'Portable Text/Block Fallback',
  component: BlockFallbackStory,
} satisfies Meta<typeof BlockFallbackStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
