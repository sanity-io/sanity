import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentTypesPillStory} from './DocumentTypesPillStory'

/**
 * Reuses the in-package harness: global-search type pills (all / short /
 * truncated) and a boolean FilterPill after the mixed Card / ui5 Flex
 * migration.
 */
const meta = {
  title: 'Studio/Search Pills',
  component: DocumentTypesPillStory,
} satisfies Meta<typeof DocumentTypesPillStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
