import {type Meta, type StoryObj} from '@storybook/react-vite'

import {IncomingReferencesChromeStory} from './IncomingReferencesChromeStory'

/**
 * Chromatic sentinel: incoming-references field header and the critical
 * missing-types card after the ui5 Text migration. Fixture copy only.
 */
const meta = {
  title: 'Structure/Incoming References Chrome',
  component: IncomingReferencesChromeStory,
} satisfies Meta<typeof IncomingReferencesChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
