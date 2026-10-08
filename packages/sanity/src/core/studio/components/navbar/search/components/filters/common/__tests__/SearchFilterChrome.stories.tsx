import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchFilterChromeStory} from './SearchFilterChromeStory'

/**
 * Reuses the in-package harness: search filter popover header, field details,
 * title truncation and number-range inputs after the ui5 Flex/Box migration.
 */
const meta = {
  title: 'Studio/Search Filter Chrome',
  component: SearchFilterChromeStory,
} satisfies Meta<typeof SearchFilterChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
