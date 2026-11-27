import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentPreviewPresenceStory} from './DocumentPreviewPresenceStory'

/**
 * Chromatic sentinel: document preview presence AvatarStack (one, two, and
 * overflow past maxLength=2) after the Sanity UI theme-space margin
 * migration. Fixture users, tooltips closed.
 */
const meta = {
  title: 'Presence/Document Preview Presence',
  component: DocumentPreviewPresenceStory,
} satisfies Meta<typeof DocumentPreviewPresenceStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
