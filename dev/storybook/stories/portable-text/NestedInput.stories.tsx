import {type Meta, type StoryObj} from '@storybook/react-vite'

import NestedInputStory from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/NestedInputStory'

/**
 * Reuses the `NestedInput.browser.test.tsx` harness: Portable Text inputs
 * nested inside object arrays within another Portable Text input.
 */
const meta = {
  title: 'Portable Text/Nested Input',
  component: NestedInputStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof NestedInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
