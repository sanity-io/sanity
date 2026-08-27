import {type Meta, type StoryObj} from '@storybook/react-vite'

import {FromToLayoutStory} from './FromToLayoutStory'

/**
 * Reuses the in-package harness: review-changes FromTo inline/grid layout
 * after the ui5 Flex migration. Static labels, no live diffs.
 */
const meta = {
  title: 'Field/From To Layout',
  component: FromToLayoutStory,
} satisfies Meta<typeof FromToLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
