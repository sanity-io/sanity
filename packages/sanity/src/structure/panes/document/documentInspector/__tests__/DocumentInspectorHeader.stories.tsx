import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentInspectorHeaderStory} from './DocumentInspectorHeaderStory'

/**
 * Chromatic sentinel: post-migration ui5 document inspector header,
 * including a wrapping title. Fixture titles only.
 */
const meta = {
  title: 'Structure/Document Inspector Header',
  component: DocumentInspectorHeaderStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof DocumentInspectorHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
