import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FilterNoMatchesStory} from './FilterNoMatchesStory'

/**
 * Reuses the in-package harness: the perspective menu's empty-filter message
 * after the ui5 Box / Text migration. Short and long queries pin wrapping of
 * the interpolated string. Copy is a locale fixture.
 */
const meta = {
  title: 'Perspective/Filter No Matches',
  component: FilterNoMatchesStory,
} satisfies Meta<typeof FilterNoMatchesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
