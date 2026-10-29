import {type Meta, type StoryObj} from '@storybook/react-vite'

import {TabStory} from './TabStory'

/**
 * The studio's `ui-components` wrapper around the `@sanity/ui` Tab. Padding
 * and font size are fixed, and `iconRight` is a studio-only extension — both
 * are easy to regress when migrating the Tab primitive to ui5.
 */
const meta = {
  title: 'UI Components/Tab',
  component: TabStory,
} satisfies Meta<typeof TabStory>

export default meta
type Story = StoryObj<typeof meta>

export const AllVariants: Story = {}
