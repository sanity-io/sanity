import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DescriptionInputBlockStory} from './DescriptionInputBlockStory'

/**
 * Reuses the in-package harness: Box padding on task description blocks.
 * Copy is static (no timestamps).
 */
const meta = {
  title: 'Tasks/Description Input Block',
  component: DescriptionInputBlockStory,
} satisfies Meta<typeof DescriptionInputBlockStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
