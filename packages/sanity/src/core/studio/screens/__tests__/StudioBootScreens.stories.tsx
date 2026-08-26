import {type Meta, type StoryObj} from '@storybook/react-vite'

import {StudioBootScreensStory} from './StudioBootScreensStory'

/**
 * Reuses the in-package harness: studio boot cards (no tools, missing tool,
 * redirect) after the ui5 Box migration. Fixed reasons/names, no live time.
 */
const meta = {
  title: 'Studio/Boot Screens',
  component: StudioBootScreensStory,
} satisfies Meta<typeof StudioBootScreensStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
