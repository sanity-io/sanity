import {type Meta, type StoryObj} from '@storybook/react-vite'

import {MenuGroupStory} from '../../../../packages/sanity/src/ui-components/menuGroup/__tests__/MenuGroupStory'

/**
 * Reuses the in-package harness: closed MenuGroup rows across tones, plus
 * disabled. Nested submenus stay closed (no animated popover).
 */
const meta = {
  title: 'UI Components/Menu Group',
  component: MenuGroupStory,
} satisfies Meta<typeof MenuGroupStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {}
