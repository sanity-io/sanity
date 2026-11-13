import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseTitleStory} from './ReleaseTitleStory'

/**
 * Chromatic sentinel: ReleaseTitle Box wrapper and 50-character truncation
 * (tooltip stays closed). Fixture titles only.
 */
const meta = {
  title: 'Releases/Release Title',
  component: ReleaseTitleStory,
} satisfies Meta<typeof ReleaseTitleStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
