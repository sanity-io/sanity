import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FileInputWarningsStory} from './FileInputWarningsStory'

/**
 * Chromatic sentinel: invalid image/file, stale upload, and private-access
 * badge after the ui5 Box migration. Studio i18n only.
 */
const meta = {
  title: 'Inputs/File Input Warnings',
  component: FileInputWarningsStory,
} satisfies Meta<typeof FileInputWarningsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
