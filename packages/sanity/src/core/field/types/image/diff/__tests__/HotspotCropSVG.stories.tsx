import {type Meta, type StoryObj} from '@storybook/react-vite'

import {HotspotCropSVGStory} from './HotspotCropSVGStory'

/**
 * Chromatic sentinel: review-changes image crop rect, hotspot ellipse, and
 * combined mask overlay. Fixture author colors. Tooltips stay closed.
 */
const meta = {
  title: 'Field/Hotspot Crop SVG',
  component: HotspotCropSVGStory,
} satisfies Meta<typeof HotspotCropSVGStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
