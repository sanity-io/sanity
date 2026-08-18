import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseDocumentFilterTabsStory} from './ReleaseDocumentFilterTabsStory'

/**
 * Reuses the in-package harness: Box padding around release-detail filter
 * tabs, including selected tones for all / added / errors. Counts are
 * static fixtures (no live data).
 */
const meta = {
  title: 'Releases/Document Filter Tabs',
  component: ReleaseDocumentFilterTabsStory,
} satisfies Meta<typeof ReleaseDocumentFilterTabsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
