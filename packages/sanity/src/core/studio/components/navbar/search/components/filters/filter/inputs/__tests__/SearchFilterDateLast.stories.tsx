import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {SearchFilterDateLastStory} from './SearchFilterDateLastStory'

/**
 * Chromatic sentinel: global-search last-N-days/months/years filter after
 * the ui5 Flex migration. Studio i18n only; no live queries.
 */
const meta = {
  title: 'Studio/Search Filter Date Last',
  component: SearchFilterDateLastStory,
} satisfies Meta<typeof SearchFilterDateLastStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findAllByLabelText('Unit value', {}, {timeout: 5_000})
  },
}
