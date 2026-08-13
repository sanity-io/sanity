import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DecoratorsStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/DecoratorsStory'

/**
 * Reuses the `Decorators.browser.test.tsx` harness: a Portable Text input
 * with the default decorator set (strong, em, code, underline, strike).
 */
const meta = {
  title: 'Portable Text/Decorators',
  component: DecoratorsStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof DecoratorsStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
