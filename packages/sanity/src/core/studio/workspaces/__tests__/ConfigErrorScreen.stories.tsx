import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ConfigErrorScreenStory} from './ConfigErrorScreenStory'

/**
 * Chromatic sentinel for the workspace config error screens: heading, muted
 * message with inline-code config keys, the project/dataset detail rows, the
 * Manage deep link and the docs link, with and without the "Choose another
 * workspace" button. Project and dataset names are fixtures; the workspace
 * chooser state is left out (its cards probe auth over the network).
 */
const meta = {
  title: 'Studio/Config Error Screen',
  component: ConfigErrorScreenStory,
  args: {
    error: {type: 'projectNotFound'},
    projectId: 'ppsg7ml5',
    dataset: 'production',
    isStaging: false,
    multipleWorkspaces: false,
  },
} satisfies Meta<typeof ConfigErrorScreenStory>

export default meta
type Story = StoryObj<typeof meta>

/** Unknown project ID named in the message; single workspace, so no chooser button. */
export const ProjectNotFound: Story = {}

/** Unknown project with no ID to name: the generic message. */
export const ProjectNotFoundWithoutId: Story = {
  args: {projectId: undefined},
}

/** Two visible workspaces add the "Choose another workspace" button above the heading. */
export const ProjectNotFoundChooseAnother: Story = {
  args: {multipleWorkspaces: true},
}

/** Dataset rows for project ID and dataset, "Manage datasets" deep link. */
export const DatasetNotFound: Story = {
  args: {error: {type: 'datasetNotFound'}},
}

/** Dataset branch with the chooser button and the staging Manage host. */
export const DatasetNotFoundChooseAnother: Story = {
  args: {error: {type: 'datasetNotFound'}, multipleWorkspaces: true, isStaging: true},
}
