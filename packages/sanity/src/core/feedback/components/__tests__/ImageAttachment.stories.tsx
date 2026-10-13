import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ImageAttachmentStory} from './ImageAttachmentStory'

/**
 * Reuses the in-package harness: feedback image-attachment Card tones
 * and Flex rows after the ui5 Text/VStack migration.
 */
const meta = {
  title: 'Studio/Image Attachment',
  component: ImageAttachmentStory,
} satisfies Meta<typeof ImageAttachmentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
