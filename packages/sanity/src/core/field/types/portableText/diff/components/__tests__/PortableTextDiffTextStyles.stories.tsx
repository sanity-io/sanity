import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PortableTextDiffTextStylesStory} from './PortableTextDiffTextStylesStory'

/**
 * Chromatic sentinel: portable-text review-changes heading sizes, paragraph
 * wrap, and blockquote after the ui5 Heading migration. Fixture copy only.
 */
const meta = {
  title: 'Field/Portable Text Diff Text Styles',
  component: PortableTextDiffTextStylesStory,
} satisfies Meta<typeof PortableTextDiffTextStylesStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
