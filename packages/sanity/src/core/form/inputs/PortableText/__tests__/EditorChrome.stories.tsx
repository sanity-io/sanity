import {type Meta, type StoryObj} from '@storybook/react-vite'

import {EditorChromeStory} from './EditorChromeStory'

/**
 * Chromatic sentinel: the Portable Text toolbar at full width and collapsed
 * below 400px, plus the open popover edit dialog, rendered directly (no form
 * builder) after the ui5 Flex migration.
 */
const meta = {
  title: 'Portable Text/Editor Chrome',
  component: EditorChromeStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
  // The collapsed toolbar depends on a ResizeObserver measurement after mount.
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof EditorChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
