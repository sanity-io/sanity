import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {SearchChromeStory} from './SearchChromeStory'

/**
 * Chromatic sentinel: post-migration ui5 search instructions, no-results
 * message, include-time footer, styled TextInput host, and compact vs
 * fullscreen SearchHeader. Studio i18n only; no live queries.
 */
const meta = {
  title: 'Studio/Search Chrome',
  component: SearchChromeStory,
} satisfies Meta<typeof SearchChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findAllByPlaceholderText('Search', {}, {timeout: 5_000})
  },
}
