import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NavDrawerMenusStory} from './NavDrawerMenusStory'

/**
 * Chromatic sentinel: nav drawer tool list and appearance menu after the ui5
 * Stack to VStack migration. Fixture tools, pinned color scheme.
 */
const meta = {
  title: 'Studio/Nav Drawer Menus',
  component: NavDrawerMenusStory,
} satisfies Meta<typeof NavDrawerMenusStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
