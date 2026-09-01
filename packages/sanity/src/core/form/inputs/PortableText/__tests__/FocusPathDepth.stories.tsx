import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FocusPathDepthStory} from './FocusPathDepthStory'

/**
 * Reuses the `FocusPathDepth.browser.test.tsx` harness: deeply nested
 * Portable Text structures used to verify focus path handling at depth.
 */
const meta = {
  title: 'Portable Text/Focus Path Depth',
  component: FocusPathDepthStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof FocusPathDepthStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
