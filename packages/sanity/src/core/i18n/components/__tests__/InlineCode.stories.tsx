import {type Meta, type StoryObj} from '@storybook/react-vite'

import {InlineCodeStory} from './InlineCodeStory'

/**
 * Chromatic sentinel: `InlineCode` inside translated copy and standalone.
 * Fixture strings only.
 */
const meta = {
  title: 'i18n/Inline Code',
  component: InlineCodeStory,
} satisfies Meta<typeof InlineCodeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
