import {type Meta, type StoryObj} from '@storybook/react-vite'

import {BooleanInputStory} from './BooleanInputStory'

/**
 * Chromatic sentinel: boolean switch and checkbox layouts, including
 * read-only and validation tones, after the ui5 Flex migration. Fixture
 * copy; tooltips stay closed.
 */
const meta = {
  title: 'Inputs/Boolean Input',
  component: BooleanInputStory,
} satisfies Meta<typeof BooleanInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
