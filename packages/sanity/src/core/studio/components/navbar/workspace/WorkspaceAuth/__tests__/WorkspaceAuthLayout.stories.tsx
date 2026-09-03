import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WorkspaceAuthLayoutStory} from './WorkspaceAuthLayoutStory'

/**
 * Chromatic sentinel: workspace login Layout (string header, string header
 * with footer, node header) after the ui5 Box migration. Fixture copy only.
 */
const meta = {
  title: 'Studio/Workspace Auth Layout',
  component: WorkspaceAuthLayoutStory,
} satisfies Meta<typeof WorkspaceAuthLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
