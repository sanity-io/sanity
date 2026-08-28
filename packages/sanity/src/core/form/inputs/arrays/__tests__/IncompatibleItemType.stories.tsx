import {type Meta, type StoryObj} from '@storybook/react-vite'

import {IncompatibleItemTypeStory} from './IncompatibleItemTypeStory'

/**
 * Reuses the in-package harness: incompatible array-item prompt after the
 * ui5 Box migration. Fixture values; popover stays closed.
 */
const meta = {
  title: 'Form/Incompatible Item Type',
  component: IncompatibleItemTypeStory,
} satisfies Meta<typeof IncompatibleItemTypeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
