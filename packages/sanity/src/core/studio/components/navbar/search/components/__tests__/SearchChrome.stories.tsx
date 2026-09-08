import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchChromeStory} from './SearchChromeStory'

/**
 * Chromatic sentinel: post-migration ui5 search instructions and
 * include-time footer. Studio i18n only; no live queries.
 */
const meta = {
  title: 'Studio/Search Chrome',
  component: SearchChromeStory,
} satisfies Meta<typeof SearchChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
