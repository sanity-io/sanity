import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentListPaneSearchOrderingStory} from './DocumentListPaneSearchOrderingStory'

/**
 * Chromatic sentinel: ui5 Box padding on the document-list search ordering
 * control. The sort menu stays closed.
 */
const meta = {
  title: 'Structure/Document List Search Ordering',
  component: DocumentListPaneSearchOrderingStory,
} satisfies Meta<typeof DocumentListPaneSearchOrderingStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
