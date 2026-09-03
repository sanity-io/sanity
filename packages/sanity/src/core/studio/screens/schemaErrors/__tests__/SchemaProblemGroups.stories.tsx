import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaProblemGroupsStory} from './SchemaProblemGroupsStory'

/**
 * Chromatic sentinel: schema error and warning cards after the ui5 Box
 * migration, including the help-link row. Fixtures only — no live schema
 * compile.
 */
const meta = {
  title: 'Studio/Schema Problem Groups',
  component: SchemaProblemGroupsStory,
} satisfies Meta<typeof SchemaProblemGroupsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
