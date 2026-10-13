import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PortableTextDiffStory} from './PortableTextDiffStory'

/**
 * Portable Text review-changes states after the vanilla-extract migration: text decorators,
 * annotation and inline-object fallbacks, and shared changed-preview chrome.
 */
const meta = {
  title: 'Field/Portable Text Diff',
  component: PortableTextDiffStory,
} satisfies Meta<typeof PortableTextDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
