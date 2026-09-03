import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DetailLayoutStory} from './DetailLayoutStory'

/**
 * Chromatic sentinel: post-migration ui5 releases/variants detail identity
 * (four-line clamp) and properties panel. Fixture copy only.
 */
const meta = {
  title: 'Studio/Detail Layout',
  component: DetailLayoutStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof DetailLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
