import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PopoverStackingStory} from './PopoverStackingStory'

/**
 * Reuses the `PopoverStacking.browser.test.tsx` harness. `OpenEditPopover` is the
 * visual guard for SAPP-4408: text blocks use `mix-blend-mode`, so without an
 * isolation group on the editor wrapper the blended text composites over the
 * annotation edit popover that portals outside it.
 */
const meta = {
  title: 'Portable Text/Popover Stacking',
  component: PopoverStackingStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof PopoverStackingStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OpenEditPopover: Story = {
  args: {withOpenEditPopover: true},
}
