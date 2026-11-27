import {type Meta, type StoryObj} from '@storybook/react-vite'

import {PortableTextDiffChromeStory} from './PortableTextDiffChromeStory'

/**
 * Reuses the in-package harness: Portable Text review-changes heading sizes
 * and unknown-schema inline/annotation fallbacks ahead of the field Text
 * migration.
 */
const meta = {
  title: 'Field/Portable Text Diff Chrome',
  component: PortableTextDiffChromeStory,
} satisfies Meta<typeof PortableTextDiffChromeStory>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {}
