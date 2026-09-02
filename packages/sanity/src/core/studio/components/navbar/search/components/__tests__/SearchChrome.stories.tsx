import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SearchChromeStory} from './SearchChromeStory'

/**
 * Reuses the in-package harness: search instructions and include-time
 * footer after the ui5 Flex migration. Studio i18n only; no live queries.
 */
const meta = {
  title: 'Studio/Search Chrome',
  component: SearchChromeStory,
  parameters: {chromatic: {delay: 500}},
} satisfies Meta<typeof SearchChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
