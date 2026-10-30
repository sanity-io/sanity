import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NavDrawerManageMenuStory} from './NavDrawerManageMenuStory'

/**
 * Chromatic sentinel: nav-drawer manage footer (bleed Manage-project button
 * in a VStack / borderTop Card) after the ui5 Stack to VStack migration.
 * Invite stays hidden; FreeTrial is empty without trial data.
 */
const meta = {
  title: 'Studio/Nav Drawer Manage Menu',
  component: NavDrawerManageMenuStory,
} satisfies Meta<typeof NavDrawerManageMenuStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
