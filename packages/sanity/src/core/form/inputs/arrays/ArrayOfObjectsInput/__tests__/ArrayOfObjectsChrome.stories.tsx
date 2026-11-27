import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ArrayOfObjectsChromeStory} from './ArrayOfObjectsChromeStory'

/**
 * Chromatic sentinel: object-array Add-item buttons (single type, multi-type,
 * read-only, max reached) after the ui5 Grid migration. Menus stay closed.
 */
const meta = {
  title: 'Inputs/Array Of Objects Chrome',
  component: ArrayOfObjectsChromeStory,
} satisfies Meta<typeof ArrayOfObjectsChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
