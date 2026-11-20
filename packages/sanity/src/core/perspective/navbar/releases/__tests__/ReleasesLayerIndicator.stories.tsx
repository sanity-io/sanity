import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleasesLayerIndicatorStory} from './ReleasesLayerIndicatorStory'

/**
 * Reuses the in-package harness: first / within / last stack-line joins,
 * the taller default-perspective join, an out-of-range row, and the type
 * label with and without the connecting line.
 */
const meta = {
  title: 'Perspective/Releases Layer Indicator',
  component: ReleasesLayerIndicatorStory,
} satisfies Meta<typeof ReleasesLayerIndicatorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
