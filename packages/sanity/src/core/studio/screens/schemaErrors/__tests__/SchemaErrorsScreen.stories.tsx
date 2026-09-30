import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaErrorsScreenStory} from './SchemaErrorsScreenStory'

/**
 * Chromatic sentinel: the error location card naming the workspace, source,
 * project and dataset whose schema failed to compile. Fixtures only - no live
 * schema compile.
 */
const meta = {
  title: 'Studio/Schema Errors Screen',
  component: SchemaErrorsScreenStory,
} satisfies Meta<typeof SchemaErrorsScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const WithErrorLocation: Story = {}
