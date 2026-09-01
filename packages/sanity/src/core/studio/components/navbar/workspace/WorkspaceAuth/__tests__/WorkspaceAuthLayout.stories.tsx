import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WorkspaceAuthLayoutStory} from './WorkspaceAuthLayoutStory'

/**
 * Reuses the in-package harness: workspace login Layout after the ui5
 * Box migration. Fixture copy only.
 */
const meta = {
  title: 'Studio/Workspace Auth Layout',
  component: WorkspaceAuthLayoutStory,
} satisfies Meta<typeof WorkspaceAuthLayoutStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
