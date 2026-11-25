import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {SearchFiltersStory} from './SearchFiltersStory'

/**
 * Chromatic sentinel: global-search filter toolbar (compact wrap vs
 * fullscreen second row) after the ui5 Flex migration. Studio i18n only;
 * popovers stay closed.
 */
const meta = {
  title: 'Studio/Search Filters',
  component: SearchFiltersStory,
} satisfies Meta<typeof SearchFiltersStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findAllByRole('button', {name: /add filter/i}, {timeout: 5_000})
  },
}
