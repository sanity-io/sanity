import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CopyToDraftsMenuItemStory} from './CopyToDraftsMenuItemStory'

/**
 * Reuses the in-package harness: Box padding around the drafts avatar in the
 * copy-to-drafts menu row. The menu stays closed besides this single item.
 */
const meta = {
  title: 'Releases/Copy To Drafts Menu Item',
  component: CopyToDraftsMenuItemStory,
} satisfies Meta<typeof CopyToDraftsMenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
