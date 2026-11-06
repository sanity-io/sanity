import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VersionInlineBadgeStory} from './VersionInlineBadgeStory'

/**
 * Chromatic sentinel: VersionInlineBadge CSS tones and getVersionInlineBadge
 * perspective mapping. Static labels; no live releases.
 */
const meta = {
  title: 'Releases/Version Inline Badge',
  component: VersionInlineBadgeStory,
} satisfies Meta<typeof VersionInlineBadgeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
