import {type Meta, type StoryObj} from '@storybook/react-vite'

import {HotkeysStory} from './HotkeysStory'

/**
 * Reuses the in-package harness: Hotkeys keycaps with platform rewriting
 * disabled so Chromatic sees fixture Ctrl/Alt labels.
 */
const meta = {
  title: 'Studio/Hotkeys',
  component: HotkeysStory,
} satisfies Meta<typeof HotkeysStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
