import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ReleaseNameCellStory} from './ReleaseNameCellStory'

/**
 * Chromatic sentinel: Box padding on the releases-overview name cell (pin,
 * avatar, title) plus the transparent deleted row. Pin tooltips stay closed;
 * loading skeletons are omitted.
 */
const meta = {
  title: 'Releases/Name Cell',
  component: ReleaseNameCellStory,
} satisfies Meta<typeof ReleaseNameCellStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
