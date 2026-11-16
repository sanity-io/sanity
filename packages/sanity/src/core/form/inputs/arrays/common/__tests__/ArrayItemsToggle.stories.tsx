import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ArrayItemsToggleStory} from './ArrayItemsToggleStory'

/**
 * Reuses the in-package harness: array "show all / show fewer" divider after
 * the ui5 Flex migration. Studio i18n only; the toggle is not clicked.
 */
const meta = {
  title: 'Inputs/Array Items Toggle',
  component: ArrayItemsToggleStory,
} satisfies Meta<typeof ArrayItemsToggleStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
