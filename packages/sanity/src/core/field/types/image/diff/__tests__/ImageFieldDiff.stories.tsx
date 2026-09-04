import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ImageFieldDiffStory} from './ImageFieldDiffStory'

/**
 * Chromatic sentinel: post-migration ui5 image field diffs.
 * Empty placeholder and a from/to grid with no resolved assets.
 */
const meta = {
  title: 'Field/Image Diff',
  component: ImageFieldDiffStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof ImageFieldDiffStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
