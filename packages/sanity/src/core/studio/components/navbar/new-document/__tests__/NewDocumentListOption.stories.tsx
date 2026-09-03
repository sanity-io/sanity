import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NewDocumentListOptionStory} from './NewDocumentListOptionStory'

/**
 * Chromatic sentinel: new-document list rows after the ui5 Box migration.
 * Fixture titles only.
 */
const meta = {
  title: 'Studio/New Document List Option',
  component: NewDocumentListOptionStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof NewDocumentListOptionStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
