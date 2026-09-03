import {type Meta, type StoryObj} from '@storybook/react-vite'

import {NoDocumentTypesScreenStory} from './NoDocumentTypesScreenStory'

/**
 * Chromatic sentinel: the structure tool's empty schema screen ahead of the
 * ui5 Flex migration (centering Flex, icon and copy row).
 */
const meta = {
  title: 'Structure/No Document Types Screen',
  component: NoDocumentTypesScreenStory,
  tags: ['!dev', '!autodocs', 'vrt-only'],
} satisfies Meta<typeof NoDocumentTypesScreenStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
