import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ValidationStatusIconStory} from './ValidationStatusIconStory'

/**
 * Reuses the in-package harness: error / warning / info validation glyphs
 * and their badge icon color tokens. Tooltips stay closed.
 */
const meta = {
  title: 'Form/Validation Status Icon',
  component: ValidationStatusIconStory,
} satisfies Meta<typeof ValidationStatusIconStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
