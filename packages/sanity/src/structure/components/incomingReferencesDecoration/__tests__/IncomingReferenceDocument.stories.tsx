import {type Meta, type StoryObj} from '@storybook/react-vite'

import {IncomingReferenceDocumentStory} from './IncomingReferenceDocumentStory'

/**
 * Incoming-reference row states: the critical "schema type not found" card
 * and the placeholder preview for a known type that is not yet linked.
 * Chromatic pauses the placeholder fade at its end state.
 */
const meta = {
  title: 'Structure/Incoming Reference Document',
  component: IncomingReferenceDocumentStory,
} satisfies Meta<typeof IncomingReferenceDocumentStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
