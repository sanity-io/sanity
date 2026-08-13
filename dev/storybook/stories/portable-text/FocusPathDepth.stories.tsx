import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FocusPathDepthStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/FocusPathDepthStory'

/**
 * Reuses the `FocusPathDepth.browser.test.tsx` harness: deeply nested
 * Portable Text structures used to verify focus path handling at depth.
 */
const meta = {
  title: 'Portable Text/Focus Path Depth',
  component: FocusPathDepthStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof FocusPathDepthStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
