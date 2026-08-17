import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseAvatarStory} from '../../../../packages/sanity/src/core/releases/components/__tests__/ReleaseAvatarStory'

/**
 * Reuses the in-package harness: ReleaseAvatar tones/types plus StatusItem
 * Box padding. Icon color comes from `--card-badge-*-icon-color`.
 */
const meta = {
  title: 'Releases/Release Avatar',
  component: ReleaseAvatarStory,
} satisfies Meta<typeof ReleaseAvatarStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {}
