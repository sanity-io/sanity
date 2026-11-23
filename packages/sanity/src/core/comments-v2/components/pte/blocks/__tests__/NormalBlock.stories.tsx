import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NormalBlockStory} from './NormalBlockStory'

/**
 * Reuses the in-package harness: comments-v2 Portable Text normal block
 * (panda word-break) at a narrow width so long tokens wrap.
 */
const meta = {
  title: 'Comments (v2)/Normal Block',
  component: NormalBlockStory,
} satisfies Meta<typeof NormalBlockStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
