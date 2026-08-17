import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ToneIconStory} from '../../../../packages/sanity/src/ui-components/toneIcon/__tests__/ToneIconStory'

/**
 * Reuses the in-package harness: ToneIcon colored via `--card-badge-*-icon-color`.
 */
const meta = {
  title: 'UI Components/Tone Icon',
  component: ToneIconStory,
} satisfies Meta<typeof ToneIconStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllTones: Story = {}
