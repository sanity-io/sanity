import {type Meta, type StoryObj} from '@storybook/react-vite'

import {VersionModeHeaderStory} from './VersionModeHeaderStory'

/**
 * Chromatic sentinel: the diff view's version-mode header ahead of the ui5
 * Flex migration, with the release menu and document-group-picker variants.
 * Fixture versions only; pickers stay closed.
 */
const meta = {
  title: 'Structure/Diff View Version Mode Header',
  component: VersionModeHeaderStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof VersionModeHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

export const VersionMenu: Story = {
  args: {mode: 'version-menu'},
}

export const GroupPicker: Story = {
  args: {mode: 'group-picker'},
}
