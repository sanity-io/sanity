import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PerspectiveLayerIndicatorStory} from './PerspectiveLayerIndicatorStory'

/**
 * Reuses the in-package harness: perspective-menu Box label inset and the
 * in-range layer line on first / within / last items. Menus stay closed.
 */
const meta = {
  title: 'Perspective/Layer Indicator',
  component: PerspectiveLayerIndicatorStory,
} satisfies Meta<typeof PerspectiveLayerIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
