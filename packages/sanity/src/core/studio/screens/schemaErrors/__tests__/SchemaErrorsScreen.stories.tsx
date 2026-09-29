import {type Meta, type StoryObj} from '@storybook/react-vite'

import {SchemaErrorsScreenStory} from './SchemaErrorsScreenStory'

/**
 * Chromatic sentinel: full-screen schema errors takeover after the ui5
 * VStack migration (heading + copy button row above the problem list).
 * Fixtures only — no live schema compile.
 */
const meta = {
  title: 'Studio/Schema Errors Screen',
  component: SchemaErrorsScreenStory,
} satisfies Meta<typeof SchemaErrorsScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const ErrorsOnly: Story = {}
