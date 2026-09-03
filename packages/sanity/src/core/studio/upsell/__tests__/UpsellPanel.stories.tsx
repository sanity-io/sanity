import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UpsellPanelStory} from './UpsellPanelStory'

/**
 * Chromatic sentinel: shared upsell card layouts after the ui5 Box
 * migration. Static Portable Text fixture; inline SVG image; no network.
 */
const meta = {
  title: 'Studio/Upsell Panel',
  component: UpsellPanelStory,
} satisfies Meta<typeof UpsellPanelStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
