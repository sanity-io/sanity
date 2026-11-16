import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PopoverContainerStory} from './PopoverContainerStory'

/**
 * Reuses the in-package harness: popover-hosted ui5 Container widths after
 * the maxWidth-to-width workaround. Fixture copy only.
 */
const meta = {
  title: 'Components/Popover Container',
  component: PopoverContainerStory,
} satisfies Meta<typeof PopoverContainerStory>

export default meta
type Story = StoryObj<typeof meta>

export const Widths: Story = {}
