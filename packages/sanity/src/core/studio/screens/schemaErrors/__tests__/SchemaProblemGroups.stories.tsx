import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaProblemGroupsStory} from './SchemaProblemGroupsStory'

/**
 * Reuses the in-package harness: schema error and warning cards after the
 * ui5 Box migration. Fixtures only — no live schema compile.
 */
const meta = {
  title: 'Studio/Schema Problem Groups',
  component: SchemaProblemGroupsStory,
} satisfies Meta<typeof SchemaProblemGroupsStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
