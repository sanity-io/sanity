import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CommentsInspectorHeaderStory} from './CommentsInspectorHeaderStory'

/**
 * Chromatic sentinel: post-migration ui5 comments-v1 inspector header.
 * Open, resolved, and upsell filter labels. Menus stay closed.
 */
const meta = {
  title: 'Comments/Inspector Header',
  component: CommentsInspectorHeaderStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof CommentsInspectorHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
