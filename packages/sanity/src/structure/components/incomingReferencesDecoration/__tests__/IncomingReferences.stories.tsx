import {type Meta, type StoryObj} from '@storybook/react-vite'

import {IncomingReferencesStory} from './IncomingReferencesStory'

/**
 * Chromatic sentinel: the incoming-references field decoration ahead of the
 * ui5 Flex migration (header row, populated and empty lists, row actions,
 * error card, cross-dataset rows). Fixture documents only.
 */
const meta = {
  title: 'Structure/Incoming References',
  component: IncomingReferencesStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof IncomingReferencesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
