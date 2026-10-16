import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MediaPreviewStory} from './MediaPreviewStory'

/**
 * Chromatic sentinel for MediaPreview after the ui5 Box migration. Square
 * tiles with and without radius; title + subtitle is the tooltip-enabled
 * path (tooltip stays closed). Placeholders and progress overlays are
 * omitted because they animate.
 */
const meta = {
  title: 'Studio/Media Preview',
  component: MediaPreviewStory,
} satisfies Meta<typeof MediaPreviewStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
