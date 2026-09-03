import {type Meta, type StoryObj} from '@storybook/react-vite'

import NestedInputStory from './NestedInputStory'

/**
 * Reuses the `NestedInput.browser.test.tsx` harness: Portable Text inputs
 * nested inside object arrays within another Portable Text input.
 */
const meta = {
  title: 'Portable Text/Nested Input',
  component: NestedInputStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof NestedInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
