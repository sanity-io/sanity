import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MediaStory} from './MediaStory'

/**
 * Reuses the in-package harness: string and icon preview media after the ui5
 * Text migration, including a selected card so `--card-fg-color` on the
 * initials stays readable. No image URLs.
 */
const meta = {
  title: 'Studio/Preview Media',
  component: MediaStory,
} satisfies Meta<typeof MediaStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
