import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ObjectBlockStory} from './ObjectBlockStory'

/**
 * Reuses the `ObjectBlock.browser.test.tsx` harness: a Portable Text input
 * with custom object blocks and inline objects.
 */
const meta = {
  title: 'Portable Text/Object Block',
  component: ObjectBlockStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ObjectBlockStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
