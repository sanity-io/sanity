import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VideoSkeletonStory} from './VideoSkeletonStory'

/**
 * Chromatic sentinel: video-input error chrome (critical RatioBox + Flex)
 * after the ui5 migration. Animated Skeleton loading is omitted.
 */
const meta = {
  title: 'Media Library/Video Skeleton',
  component: VideoSkeletonStory,
} satisfies Meta<typeof VideoSkeletonStory>

export default meta
type Story = StoryObj<typeof meta>

export const ErrorStates: Story = {}
