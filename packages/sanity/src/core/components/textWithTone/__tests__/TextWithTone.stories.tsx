import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TextWithToneStory} from './TextWithToneStory'

/**
 * Reuses the in-package harness: TextWithTone badge-token foregrounds plus
 * dimmed and muted overrides. Fixture labels, no live copy.
 */
const meta = {
  title: 'Studio/Text With Tone',
  component: TextWithToneStory,
} satisfies Meta<typeof TextWithToneStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllTones: Story = {}
