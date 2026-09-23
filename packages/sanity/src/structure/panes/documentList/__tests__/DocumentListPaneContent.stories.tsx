import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentListPaneContentStory} from './DocumentListPaneContentStory'

/**
 * Reuses the in-package harness: document list pane empty messages and the
 * fetch error layout.
 */
const meta = {
  title: 'Structure/Document List Pane Content',
  component: DocumentListPaneContentStory,
} satisfies Meta<typeof DocumentListPaneContentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
