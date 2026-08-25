import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MenuItemStory} from './MenuItemStory'

/**
 * The studio's `ui-components` MenuItem wrapper: fixed padding/font, plus
 * studio-only badge, subtitle, preview and hotkeys. Tone and layout here
 * cascade through every document/array/navbar menu during the ui5 migration.
 */
const meta = {
  title: 'UI Components/Menu Item',
  component: MenuItemStory,
} satisfies Meta<typeof MenuItemStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {}
