import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TitleDescriptionFormStory} from './TitleDescriptionFormStory'

/**
 * Chromatic sentinel: release title and description fields after the ui5
 * VStack migration. Placeholder, filled, disabled, and archived-read-only.
 * Fixture copy only.
 */
const meta = {
  title: 'Releases/Title Description Form',
  component: TitleDescriptionFormStory,
} satisfies Meta<typeof TitleDescriptionFormStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
