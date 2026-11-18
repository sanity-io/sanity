import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleasesMenuActionsStory} from './ReleasesMenuActionsStory'

/**
 * Reuses the in-package harness: the releases menu's "View content releases"
 * action row. The menu stays closed as a static list.
 */
const meta = {
  title: 'Perspective/Releases Menu Actions',
  component: ReleasesMenuActionsStory,
} satisfies Meta<typeof ReleasesMenuActionsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
