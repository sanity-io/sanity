import {type Meta, type StoryObj} from '@storybook/react-vite'

import DisableFocusAndUnsetStory from './DisableFocusAndUnsetStory'

/**
 * Reuses the `DisableFocusAndUnset.browser.test.tsx` harness: a document with
 * Portable Text fields used to verify focus/unset behavior can be disabled.
 */
const meta = {
  title: 'Portable Text/Disable Focus And Unset',
  component: DisableFocusAndUnsetStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof DisableFocusAndUnsetStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
