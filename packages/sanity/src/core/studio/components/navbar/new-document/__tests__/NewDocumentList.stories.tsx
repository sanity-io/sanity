import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NewDocumentListStory} from './NewDocumentListStory'

/**
 * Reuses the in-package harness: new-document empty and no-results
 * Flex after the vanilla-extract min-height wrapper.
 */
const meta = {
  title: 'Studio/New Document List',
  component: NewDocumentListStory,
} satisfies Meta<typeof NewDocumentListStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
