import {type Meta, type StoryObj} from '@storybook/react-vite'

import {DocumentInspectorHeaderStory} from './DocumentInspectorHeaderStory'

/**
 * Reuses the in-package harness: document inspector header after the ui5
 * Box migration. Fixture titles only.
 */
const meta = {
  title: 'Structure/Document Inspector Header',
  component: DocumentInspectorHeaderStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof DocumentInspectorHeaderStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
