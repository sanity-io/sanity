import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfigErrorScreenStory} from './ConfigErrorScreenStory'

/**
 * Chromatic sentinel: workspace configuration error takeover after the ui5
 * Flex/Box migration. Fixture project/dataset IDs, no network.
 */
const meta = {
  title: 'Studio/Config Error Screen',
  component: ConfigErrorScreenStory,
  args: {
    isStaging: false,
    projectId: 'ppsg7ml5',
  },
} satisfies Meta<typeof ConfigErrorScreenStory>

export default meta
type Story = StoryObj<typeof meta>

/** Single workspace: no "Choose another workspace" button, no details card, "Open Manage" action. */
export const ProjectNotFound: Story = {
  args: {error: {type: 'projectNotFound'}},
}

/** Two visible workspaces: back button above the heading, project/dataset details card, "Manage datasets" action. */
export const DatasetNotFound: Story = {
  args: {
    error: {type: 'datasetNotFound'},
    dataset: 'production',
    otherWorkspaces: true,
  },
}
