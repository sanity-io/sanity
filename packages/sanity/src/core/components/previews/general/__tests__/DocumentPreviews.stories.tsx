import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentPreviewsStory} from './DocumentPreviewsStory'

/**
 * Reuses the in-package harness: Box padding on default / compact / detail
 * previews after the ui5 Box migration. Media vs no-media changes paddingLeft.
 */
const meta = {
  title: 'Studio/Document Previews',
  component: DocumentPreviewsStory,
} satisfies Meta<typeof DocumentPreviewsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
