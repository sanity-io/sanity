import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TimelineErrorStory} from './TimelineErrorStory'

/**
 * Chromatic sentinel: post-migration ui5 timeline error chrome. Default
 * and version-document copy. Fixture strings only.
 */
const meta = {
  title: 'Structure/Timeline Error',
  component: TimelineErrorStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof TimelineErrorStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
