import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorMessageStory} from './ErrorMessageStory'

/**
 * Reuses the in-package harness: workspace-loader ErrorMessage after the
 * ui5 Flex/Box migration. Fixture path and message; no stack trace.
 */
const meta = {
  title: 'Studio/Workspace Loader Error',
  component: ErrorMessageStory,
} satisfies Meta<typeof ErrorMessageStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
