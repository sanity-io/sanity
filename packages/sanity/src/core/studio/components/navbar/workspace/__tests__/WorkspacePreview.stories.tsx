import {type Meta, type StoryObj} from '@storybook/react-vite'

import {WorkspacePreviewStory} from './WorkspacePreviewStory'

/**
 * Reuses the in-package harness: workspace switcher rows (selected,
 * signed-out, no-access) after the ui5 Box migration. Skip the loading
 * state — "Checking…" is transient and not a migration risk.
 */
const meta = {
  title: 'Studio/Workspace Preview',
  component: WorkspacePreviewStory,
} satisfies Meta<typeof WorkspacePreviewStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
