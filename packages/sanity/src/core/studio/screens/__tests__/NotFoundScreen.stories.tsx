import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NotFoundScreenStory} from './NotFoundScreenStory'

/**
 * Reuses the in-package harness: workspace-not-found screen after the ui5
 * Flex migration. Hardcoded copy; no router navigation.
 */
const meta = {
  title: 'Studio/Not Found Screen',
  component: NotFoundScreenStory,
} satisfies Meta<typeof NotFoundScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
