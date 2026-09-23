import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseDocumentFilterTabsStory} from './ReleaseDocumentFilterTabsStory'

/**
 * Chromatic sentinel: Box padding around release-detail filter tabs, with
 * each filter selected in turn so every selected tone is captured. Counts
 * are static fixtures (no live data).
 */
const meta = {
  title: 'Releases/Document Filter Tabs',
  component: ReleaseDocumentFilterTabsStory,
} satisfies Meta<typeof ReleaseDocumentFilterTabsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
