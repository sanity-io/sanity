import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TagInputStory} from './TagInputStory'

/**
 * Reuses the in-package harness: tags input empty / populated / readOnly
 * pills after the ui5 Flex/Box migration.
 */
const meta = {
  title: 'Form/Tag Input',
  component: TagInputStory,
} satisfies Meta<typeof TagInputStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
