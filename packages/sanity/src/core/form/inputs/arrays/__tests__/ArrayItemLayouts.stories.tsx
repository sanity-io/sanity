import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ArrayItemLayoutsStory} from './ArrayItemLayoutsStory'

/**
 * Chromatic sentinel: array grid cells (`CellLayout`) and list rows
 * (`RowLayout`) with drag handle, presence, validation and menu chrome, after
 * the ui5 Flex migration. Fixture values; menus stay closed.
 */
const meta = {
  title: 'Inputs/Array Item Layouts',
  component: ArrayItemLayoutsStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof ArrayItemLayoutsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
