import {type Meta, type StoryObj} from '@storybook/react-vite'

import {IncompatibleItemTypeStory} from './IncompatibleItemTypeStory'

/**
 * Chromatic sentinel: incompatible array-item prompt after the ui5 Box
 * migration, including a narrowed state where the prompt truncates. Fixture
 * values; popover stays closed.
 */
const meta = {
  title: 'Inputs/Incompatible Item Type',
  component: IncompatibleItemTypeStory,
} satisfies Meta<typeof IncompatibleItemTypeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
