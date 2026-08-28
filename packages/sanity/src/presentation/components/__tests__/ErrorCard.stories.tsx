import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorCardStory} from './ErrorCardStory'

/**
 * Reuses the in-package harness: Presentation error card after the ui5 Box
 * migration. Fixed message; no live iframe.
 */
const meta = {
  title: 'Presentation/Error Card',
  component: ErrorCardStory,
} satisfies Meta<typeof ErrorCardStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
