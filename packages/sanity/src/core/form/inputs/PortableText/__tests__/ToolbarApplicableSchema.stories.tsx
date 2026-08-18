import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ToolbarApplicableSchemaStory} from './ToolbarApplicableSchemaStory'

/**
 * Reuses the `ToolbarApplicableSchema.browser.test.tsx` harness: toolbar
 * rendering for schemas where only a subset of block tools apply.
 */
const meta = {
  title: 'Portable Text/Toolbar Applicable Schema',
  component: ToolbarApplicableSchemaStory,
  parameters: {chromatic: {delay: 300}},
} satisfies Meta<typeof ToolbarApplicableSchemaStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
