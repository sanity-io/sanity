import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaErrorsScreenStory} from './SchemaErrorsScreenStory'

/**
 * Chromatic sentinel: full-screen schema errors takeover after the ui5
 * VStack migration (heading + copy button row above the problem list), and
 * the error location card naming the workspace, source, project and dataset
 * whose schema failed to compile. Fixtures only — no live schema compile.
 */
const meta = {
  title: 'Studio/Schema Errors Screen',
  component: SchemaErrorsScreenStory,
} satisfies Meta<typeof SchemaErrorsScreenStory>

export default meta
type Story = StoryObj<typeof meta>

/** No context: heading row straight into the problem list. */
export const ErrorsOnly: Story = {}

/** The thrower knew which workspace and source failed, so the location card renders. */
export const WithErrorLocation: Story = {
  args: {
    context: {
      workspaceName: 'media-gallery',
      sourceName: 'secondary',
      projectId: 'ppsg7ml5',
      dataset: 'playground',
    },
  },
}
