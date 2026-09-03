import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchFilterMenuHeadersStory} from './SearchFilterMenuHeadersStory'

/**
 * Chromatic sentinel: search add-filter menu section headers after the ui5
 * Box migration. Fixture titles only.
 */
const meta = {
  title: 'Studio/Search Filter Menu Headers',
  component: SearchFilterMenuHeadersStory,
} satisfies Meta<typeof SearchFilterMenuHeadersStory>

export default meta
type Story = StoryObj<typeof meta>

export const Tones: Story = {}
