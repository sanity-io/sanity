import {type Meta, type StoryObj} from '@storybook/react-vite'
import {within} from 'storybook/test'

import {NoDocumentTypesScreenStory} from './NoDocumentTypesScreenStory'

/**
 * Chromatic sentinel: empty-schema structure screen. Caution card with
 * docs link. Fixture copy only (no live schema).
 */
const meta = {
  title: 'Structure/No Document Types Screen',
  component: NoDocumentTypesScreenStory,
} satisfies Meta<typeof NoDocumentTypesScreenStory>

export default meta
type Story = StoryObj<typeof meta>

/** TestWrapper suspends on the mock workspace. */
export const States: Story = {
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await canvas.findByRole('link', {name: 'Learn how to add a document type →'})
  },
}
