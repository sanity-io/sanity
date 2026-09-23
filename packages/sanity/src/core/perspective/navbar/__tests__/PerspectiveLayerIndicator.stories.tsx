import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PerspectiveLayerIndicatorStory} from './PerspectiveLayerIndicatorStory'

/**
 * Chromatic sentinel: the perspective releases menu with its layer line,
 * rendered through the production menu items so the indicator offsets track
 * the real ui5 Box paddings. Covers first / within / last items and
 * release-type labels inside and outside the range. Menus stay closed.
 */
const meta = {
  title: 'Perspective/Releases Menu',
  component: PerspectiveLayerIndicatorStory,
} satisfies Meta<typeof PerspectiveLayerIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
