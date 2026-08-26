import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchErrorStatesStory} from './SearchErrorStatesStory'

/**
 * Reuses the in-package harness: search, filter, and asset-source error
 * states after the ui5 Box migration. Studio i18n only; no live queries.
 */
const meta = {
  title: 'Studio/Search Error States',
  component: SearchErrorStatesStory,
} satisfies Meta<typeof SearchErrorStatesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
