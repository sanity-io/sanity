import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UpsellPanelStory} from './UpsellPanelStory'

/**
 * Reuses the in-package harness: shared upsell card after the ui5 Box
 * migration. Static Portable Text fixture; no image or network.
 */
const meta = {
  title: 'Studio/Upsell Panel',
  component: UpsellPanelStory,
} satisfies Meta<typeof UpsellPanelStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
