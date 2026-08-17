import {type Meta, type StoryObj} from '@storybook/react-vite'

import {InputStory} from '../../../../packages/sanity/src/core/form/inputs/PortableText/__tests__/InputStory'

/**
 * Reuses the `Input.browser.test.tsx` harness: a Portable Text input with
 * inline objects, object blocks and nested arrays, rendered inside the mock
 * studio (`TestWrapper` + `TestForm`).
 */
const meta = {
  title: 'Portable Text/Input',
  component: InputStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof InputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
