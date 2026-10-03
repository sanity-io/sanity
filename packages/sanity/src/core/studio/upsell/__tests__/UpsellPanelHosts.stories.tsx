import {type Meta, type StoryObj} from '@storybook/react-vite'

import {UpsellPanelHostsStory} from './UpsellPanelHostsStory'

/**
 * Chromatic sentinel: the Container hosts that size `UpsellPanel` in the
 * tasks sidebar, the document-limit screen and the releases overview empty
 * states. Static fixtures; no network; no dialog.
 */
const meta = {
  title: 'Studio/Upsell Panel Hosts',
  component: UpsellPanelHostsStory,
  // The document-limit and releases hosts fade in through motion/react
  // (200ms and 300ms); capture after both have settled.
  parameters: {chromatic: {delay: 400}},
} satisfies Meta<typeof UpsellPanelHostsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
